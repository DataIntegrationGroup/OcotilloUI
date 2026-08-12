import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const authentikApiBase = env.VITE_AUTHENTIK_API_BASE_URL
  const authentikProxyPath =
    authentikApiBase?.startsWith('/') && authentikApiBase !== '/'
      ? authentikApiBase.replace(/\/+$/, '')
      : null
  const authentikProxyTarget =
    env.VITE_AUTHENTIK_PROXY_TARGET ||
    env.VITE_AUTHENTIK_BASE_URL ||
    (env.VITE_AUTHENTIK_URL
      ? new URL(env.VITE_AUTHENTIK_URL).origin
      : undefined)
  const enableSourceMap =
    mode !== 'production' && env.VITE_DISABLE_SOURCEMAP !== 'true'
  const enableSentry =
    mode !== 'production' && env.VITE_SENTRY_TELEMETRY_DISABLED !== 'true'
  const rewriteAuthentikDevCookies =
    env.VITE_AUTHENTIK_PROXY_REWRITE_COOKIES !== 'false'
  const logAuthentikProxy = env.VITE_AUTHENTIK_PROXY_DEBUG === 'true'

  return {
    build: {
      sourcemap: enableSourceMap,
      rollupOptions: {
        output: {
          // Let Rollup decide chunking. Manually forcing chunk boundaries can
          // lead to subtle ESM execution order issues and duplicate React
          // module graphs (which often manifests as hooks being undefined).
        },
      },
    },
    base: env.VITE_BASE_URL,
    resolve: {
      // Prevent duplicate copies of React sneaking in via dependency subtrees.
      dedupe: ['react', 'react-dom', 'scheduler', 'use-sync-external-store'],
    },
    plugins: [
      // Write dist/version.json at the end of each build so polling clients can
      // detect that a new version has been deployed. We write to dist/ only so
      // public/version.json (the dev placeholder) is never modified locally.
      {
        name: 'write-version-json',
        closeBundle() {
          writeFileSync(
            resolve(__dirname, 'dist/version.json'),
            JSON.stringify({ buildTime: new Date().toISOString() })
          )
        },
      },
      tailwindcss(),
      react(),
      tsconfigPaths(),
      ...(enableSentry
        ? [
            sentryVitePlugin({
              authToken: env.VITE_SENTRY_AUTH_TOKEN,
              org: env.VITE_SENTRY_ORG,
              project: env.VITE_SENTRY_PROJECT,
              telemetry: false,
            }),
          ]
        : []),
    ],
    optimizeDeps: {
      include: [
        '@emotion/react',
        '@emotion/styled',
        '@mui/material/Tooltip',
        'pako',
        '@react-pdf/renderer',
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        ...(authentikProxyPath && authentikProxyTarget
          ? {
              [authentikProxyPath]: {
                target: authentikProxyTarget,
                changeOrigin: true,
                secure: true,
                cookieDomainRewrite: '',
                rewrite: (path: string) =>
                  path.replace(new RegExp(`^${authentikProxyPath}`), ''),
                configure: (proxy) => {
                  proxy.on('proxyReq', (proxyReq, req) => {
                    proxyReq.setHeader('Origin', authentikProxyTarget)
                    proxyReq.setHeader(
                      'Referer',
                      `${authentikProxyTarget}${req.url?.replace(
                        new RegExp(`^${authentikProxyPath}`),
                        ''
                      )}`
                    )

                    if (!logAuthentikProxy) return
                    console.info(
                      `[authentik-proxy] -> ${req.method} ${proxyReq.path}`
                    )
                  })

                  proxy.on('proxyRes', (proxyRes) => {
                    if (logAuthentikProxy) {
                      const location = proxyRes.headers.location
                      console.info(
                        `[authentik-proxy] <- ${proxyRes.statusCode}${
                          location ? ` location=${location}` : ''
                        }`
                      )
                    }

                    if (!rewriteAuthentikDevCookies) return

                    const setCookie = proxyRes.headers['set-cookie']
                    if (!setCookie) return

                    const cookies = Array.isArray(setCookie)
                      ? setCookie
                      : [setCookie]

                    proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
                      cookie
                        .replace(/;\s*Secure/gi, '')
                        .replace(/;\s*Domain=[^;]+/gi, '')
                        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
                    )
                  })
                },
              },
            }
          : {}),
      },
    },
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      // Don't scan checkout copies inside agent worktrees (.claude/worktrees/…)
      // — their stale duplicates otherwise fail local runs.
      exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          'dist/',
        ],
      },
      server: {
        deps: {
          inline: ['@mui/material', '@refinedev/mui', '@mui/x-data-grid'],
          fallbackCJS: true,
        },
      },
    },
  }
})

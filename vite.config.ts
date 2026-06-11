import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const enableSourceMap =
    mode !== 'production' && env.VITE_DISABLE_SOURCEMAP !== 'true'
  const enableSentry =
    mode !== 'production' && env.VITE_SENTRY_TELEMETRY_DISABLED !== 'true'

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
      // Write public/version.json on every build so polling clients can detect
      // that a new version has been deployed and prompt users to reload.
      {
        name: 'write-version-json',
        buildStart() {
          writeFileSync(
            resolve(__dirname, 'public/version.json'),
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
      },
    },
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
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

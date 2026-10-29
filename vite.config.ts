import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** CDN-hosted pdf.js worker — must match the version in react-pdf's nested pdfjs-dist. */
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs'

/**
 * Vite plugin that intercepts pre-bundled dependency responses (from .vite/deps/)
 * and replaces `'pdf.worker.mjs'` → CDN URL in-flight. Pre-bundled deps are
 * served as static files by Vite's dev server, bypassing the normal transform
 * pipeline — so we fix them at the HTTP middleware layer.
 */
function patchPdfWorker() {
  return {
    name: 'vite-patch-pdf-worker',
    apply: 'serve' as const,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (req.method !== 'GET') return next()

        // Vite serves pre-bundled deps at /@fs/<absolute>/node_modules/.vite/deps/
        if (!url.includes('/.vite/deps/')) return next()

        const originalEnd = res.end.bind(res)
        const chunks: Buffer[] = []

        // Override write to collect chunks
        ;(res as any).write = function (chunk: Buffer | string): boolean {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          return true
        }

        res.end = function (_chunk?: Buffer | string, _encoding?: BufferEncoding | (() => void), cb?: () => void): void {
          if (_chunk) {
            chunks.push(Buffer.isBuffer(_chunk) ? _chunk : Buffer.from(_chunk, _encoding as BufferEncoding))
          }

          const full = Buffer.concat(chunks).toString('utf-8')
          if (!full.includes("pdf.worker.mjs")) {
            // No patch needed — call through to original
            res.end = originalEnd
            res.end(_chunk, _encoding, cb)
            return
          }

          const patched = full.replace(/['"]pdf\.worker\.mjs['"]/g, `'${PDFJS_CDN}'`)
          const buf = Buffer.from(patched)

          // Update Content-Length; don't overwrite Content-Type if already set
          if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', 'application/javascript')
          }
          res.setHeader('Content-Length', String(buf.byteLength))
          originalEnd.call(res, buf as any, cb)
        }

        next()
      })
    },
  }
}

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
      patchPdfWorker(),
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

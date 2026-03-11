import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { sentryVitePlugin } from '@sentry/vite-plugin'

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
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined

            if (
              id.includes('mapbox-gl') ||
              id.includes('react-map-gl') ||
              id.includes('@mapbox')
            ) {
              return 'map'
            }

            if (id.includes('@react-pdf/renderer')) {
              return 'pdf'
            }

            if (id.includes('echarts')) {
              return 'charts'
            }

            if (id.includes('@mui/x-data-grid')) {
              return 'data-grid'
            }

            if (
              id.includes('/d3') ||
              id.includes('d3-') ||
              id.includes('@turf')
            ) {
              return 'geo-viz'
            }

            if (
              id.includes('@mui') ||
              id.includes('@emotion') ||
              id.includes('@base-ui-components')
            ) {
              return 'ui'
            }

            return 'vendor'
          },
        },
      },
    },
    base: env.VITE_BASE_URL,
    plugins: [
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
          inline: ['@mui/material', '@refinedev/mui'],
        },
      },
    },
  }
})

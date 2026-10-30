import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Minimal config for the headless render scripts (tools/render-*.mts).
// The app's own vite.config.ts boots env loading and the version plugin, which
// the render scripts do not need; they only need the `@/` alias.
//
// LIVES OUTSIDE THE REPO (workspace/tools/render) on purpose: nothing under this
// directory is part of OcotilloUI and nothing here may ever be pushed to it.
// Run with the repo as cwd so node_modules and relative fixture paths resolve:
//
//   cd ~/workspace/repos/OcotilloUI
//   npx vite-node --config ~/workspace/tools/render/vite.render.config.ts \
//       ~/workspace/tools/render/render-field-sheet.mts visual/pdf
const REPO = process.env.OCOTILLO_REPO ?? resolve(process.env.HOME ?? '', 'workspace/repos/OcotilloUI')

export default defineConfig({
  plugins: [tsconfigPaths({ root: REPO })],
  resolve: {
    alias: { '@': resolve(REPO, 'src') },
    dedupe: ['react', 'react-dom', 'scheduler', 'use-sync-external-store'],
  },
})

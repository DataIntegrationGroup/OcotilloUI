/**
 * FROZEN GATE — L8, packet as Tailwind cards (Q1 = C).
 *
 * Frozen 2026-11-09 by the planner, BEFORE the lane started. Do not edit.
 * If this gate fails because of a gate bug (wrong path, wrong assertion,
 * greps source instead of the loaded build), report that as a finding and
 * stop. Do not rewrite it, do not weaken it.
 *
 * Run:  npx vitest run src/test/gate/pr428-packet-tailwind.gate.test.ts
 *
 * What it decides: the shipped packet is rendered from Tailwind-styled cards
 * (shadcn Card + utility classes), and the PDF captured from that surface is a
 * real 2-page letter packet — not a @react-pdf render with a Tailwind coat of
 * paint.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const ROUTE_FILE = path.join(ROOT, 'src/pages/print/PacketPrintPage.tsx')
const ROUTE_REGISTRATION = path.join(ROOT, 'src/routes/ocotillo.tsx')
const SCRIPT = path.join(ROOT, 'scripts/packet-pdf.mjs')
const OUT_DIR = '/Users/robbalch/workspace/jobs/nmbg-liznotes-20261109/L8'
const OUT_PDF = path.join(OUT_DIR, 'packet-tailwind.pdf')

const read = (p: string) => fs.readFileSync(p, 'utf8')
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const isCI = process.env.CI === 'true' || process.env.CI === '1'

describe('L8 static surface — the packet is Tailwind markup', () => {
  it('has a print route at the contracted path', () => {
    expect(fs.existsSync(ROUTE_FILE), `missing ${ROUTE_FILE}`).toBe(true)
  })

  it('renders shadcn Card primitives, not hand-rolled boxes', () => {
    const src = read(ROUTE_FILE)
    expect(src).toMatch(/from ['"]@\/components\/ui\/card['"]/)
    expect(src).toMatch(/<Card[\s>/]/)
    expect((src.match(/<Card\b/g) ?? []).length).toBeGreaterThanOrEqual(4)
  })

  it('is styled with utility classes, at density', () => {
    const src = read(ROUTE_FILE)
    expect((src.match(/className=/g) ?? []).length).toBeGreaterThanOrEqual(20)
  })

  it('does not render the packet with @react-pdf', () => {
    const src = read(ROUTE_FILE)
    expect(src).not.toMatch(/@react-pdf/)
    expect(src).not.toMatch(/StyleSheet\.create/)
  })

  it('pins the design grid widths 13 / 19 / 12 / 13 / 43', () => {
    expect(read(ROUTE_FILE)).toMatch(/grid-cols-\[13%_19%_12%_13%_43%\]/)
  })

  it('is registered as a route', () => {
    expect(read(ROUTE_REGISTRATION)).toMatch(/print\/packet/)
  })

  it('ships a capture script and an npm entry for it', () => {
    expect(fs.existsSync(SCRIPT), `missing ${SCRIPT}`).toBe(true)
    const scripts = JSON.parse(read(path.join(ROOT, 'package.json'))).scripts ?? {}
    expect(Object.keys(scripts)).toContain('packet:pdf')
  })
})

describe.skipIf(isCI)('L8 artifact — a real letter packet from that surface', () => {
  it(
    'captures 2 pages of 612x792pt with the contracted text',
    () => {
      fs.mkdirSync(OUT_DIR, { recursive: true })
      execFileSync('npm', ['run', 'packet:pdf', '--', '--mock', '--out', OUT_PDF], {
        cwd: ROOT,
        stdio: 'pipe',
        timeout: 600_000,
        env: { ...process.env, CI: '' },
      })

      expect(fs.existsSync(OUT_PDF), `no PDF at ${OUT_PDF}`).toBe(true)
      expect(fs.statSync(OUT_PDF).size).toBeGreaterThan(10_000)

      // Tailwind really compiled the packet's classes into the shipped CSS.
      const cssDir = path.join(ROOT, 'dist/assets')
      const css = fs
        .readdirSync(cssDir)
        .filter((f) => f.endsWith('.css'))
        .map((f) => read(path.join(cssDir, f)))
        .join('\n')
      expect(css).toContain('13% 19% 12% 13% 43%')

      return (async () => {
        const doc = await pdfjs.getDocument({
          data: new Uint8Array(fs.readFileSync(OUT_PDF)),
        }).promise

        expect(doc.numPages).toBe(2)

        const pages: { w: number; h: number; text: string; lowestY: number }[] = []
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i)
          const vp = page.getViewport({ scale: 1 })
          const tc = await page.getTextContent()
          const items = tc.items.filter((it: never) => (it as { str?: string }).str?.trim())
          pages.push({
            w: vp.width,
            h: vp.height,
            text: items.map((it: never) => (it as { str: string }).str).join(' '),
            lowestY: Math.min(...items.map((it: never) => (it as { transform: number[] }).transform[5])),
          })
        }

        for (const [i, p] of pages.entries()) {
          expect(p.w, `page ${i + 1} width`).toBeGreaterThan(611)
          expect(p.w, `page ${i + 1} width`).toBeLessThan(613)
          expect(p.h, `page ${i + 1} height`).toBeGreaterThan(791)
          expect(p.h, `page ${i + 1} height`).toBeLessThan(793)
          expect(p.lowestY, `page ${i + 1} content clipped at the bottom edge`).toBeGreaterThan(18)
        }

        const p1 = squash(pages[0].text)
        const p2 = squash(pages[1].text)

        expect(p1).toContain('depthtowaterbelowgroundsurface')
        expect(p1).toContain('newmeasurement')
        expect(p1).toContain('installedequipment')
        expect(p1).not.toContain('observation')
        expect(p2).toContain('ownersheet')
        expect(p1).not.toContain('ownersheet')
      })()
    },
    660_000
  )
})

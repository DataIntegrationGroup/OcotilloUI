/**
 * FROZEN GATE — L3 (round 2), the owner sheet is real: identity, write-in,
 * readings table, contact line — rendered from the Tailwind packet surface.
 *
 * Frozen 2026-11-09 21:42 by the planner, BEFORE the lane started. Do not edit.
 * Amended 2026-11-09 on Rob's word: line 154 `mphalt` -> `mphtft`, the squash of
 * the verified `MP Ht (ft)`. `mphalt` had no producer anywhere in src; no other
 * assertion changed. This sits inside describe.skipIf(isCI), so CI=true runs
 * cannot catch it.
 * Supersedes the 17:06 gate (sha256 425339ba…), which rendered the packet
 * through `@react-pdf/renderer` — a path Q1 = C retired.
 * If this gate fails because of a gate bug (wrong path, wrong assertion,
 * greps source instead of the loaded build), report that as a finding and
 * stop. Do not rewrite it, do not weaken it.
 *
 * Run:  npx vitest run src/test/gate/pr428-liznotes-L3.gate.test.ts
 *
 * What it decides: page 2 of the shipped packet is the owner sheet, fed from
 * the well's own readings — not the mock's five-line copy, not a placeholder
 * table — and page 1 is untouched by that work.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const ROUTE_FILE = path.join(ROOT, 'src/pages/print/PacketPrintPage.tsx')
const DATA_FILE = path.join(ROOT, 'src/pages/print/packetData.ts')
const MOCK_FILE = path.join(ROOT, 'src/pages/mock/PacketMock.tsx')
const OUT_DIR = '/Users/robbalch/workspace/jobs/nmbg-liznotes-20261109/L3'
const OUT_PDF = path.join(OUT_DIR, 'packet-l3.pdf')

const read = (p: string) => fs.readFileSync(p, 'utf8')
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const isCI = process.env.CI === 'true' || process.env.CI === '1'

const RETIRED = ['Reserve Well 4', 'Ethan Mamer', 'WL-0085', '34.86']

describe('L3 static surface — one builder, one table, no @react-pdf', () => {
  it('has a packet data builder and the page uses it', () => {
    expect(fs.existsSync(DATA_FILE), `missing ${DATA_FILE}`).toBe(true)
    expect(read(DATA_FILE)).toMatch(/export\s+function\s+buildPacketData/)
    expect(read(ROUTE_FILE)).toMatch(/from ['"]@\/pages\/print\/packetData['"]/)
    expect(read(ROUTE_FILE)).toMatch(/buildPacketData\s*\(/)
  })

  it('pins the page-2 table grid 26 / 18 / 18 / 38', () => {
    expect(read(ROUTE_FILE)).toMatch(/grid-cols-\[26%_18%_18%_38%\]/)
  })

  it('carries the contracted column headers verbatim (D23, D13)', () => {
    const src = read(ROUTE_FILE)
    expect(src).toContain('Depth to Water Below Ground Surface (ft)')
    expect(src).toContain('MP Ht (ft)')
    expect(src).toContain('Level Status')
  })

  it('names the page-2 write-in card New Measurement', () => {
    expect(read(ROUTE_FILE)).toContain('New Measurement')
  })

  it('does not render the owner sheet with @react-pdf or pin page totals', () => {
    const src = read(ROUTE_FILE)
    expect(src).not.toMatch(/@react-pdf/)
    expect(src).not.toMatch(/StyleSheet\.create/)
    expect(src).not.toMatch(/numPages/)
    expect(src).not.toMatch(/totalPages/)
    expect(src).not.toMatch(/PageFooter/)
  })

  it('leaves page 1 frozen — grid and one prefilled row survive', () => {
    expect(read(ROUTE_FILE)).toMatch(/grid-cols-\[13%_19%_12%_13%_43%\]/)
  })

  it('drops every retired owner-sheet mock value from the print path', () => {
    for (const file of [ROUTE_FILE, DATA_FILE, MOCK_FILE]) {
      if (!fs.existsSync(file)) continue
      const src = read(file)
      for (const stale of RETIRED) {
        expect(src, `${path.basename(file)} still carries "${stale}"`).not.toContain(stale)
      }
    }
  })
})

describe.skipIf(isCI)('L3 artifact — the owner sheet prints the well’s readings', () => {
  it(
    'captures 2 pages, page 2 carrying identity + 3 readings newest-first',
    () => {
      fs.mkdirSync(OUT_DIR, { recursive: true })
      execFileSync('npm', ['run', 'packet:pdf', '--', '--mock', '--out', OUT_PDF], {
        cwd: ROOT,
        stdio: 'pipe',
        timeout: 600_000,
        env: { ...process.env, CI: '' },
      })

      expect(fs.existsSync(OUT_PDF), `no PDF at ${OUT_PDF}`).toBe(true)
      expect(fs.statSync(OUT_PDF).size).toBeGreaterThan(20_000)

      // Tailwind really compiled the page-2 grid into the shipped CSS.
      const cssDir = path.join(ROOT, 'dist/assets')
      const css = fs
        .readdirSync(cssDir)
        .filter((f) => f.endsWith('.css'))
        .map((f) => read(path.join(cssDir, f)))
        .join('\n')
      expect(css).toContain('26% 18% 18% 38%')

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
          const items = (tc.items as unknown[])
            .map((it) => it as { str?: string; transform?: number[] })
            .filter((it) => !!it.str?.trim() && Array.isArray(it.transform))
          pages.push({
            w: vp.width,
            h: vp.height,
            text: items.map((it) => it.str!).join(' '),
            lowestY: Math.min(...items.map((it) => it.transform![5])),
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

        // page 1 is untouched by this lane
        expect(p1).toContain('depthtowaterbelowgroundsurface')
        expect(p1).toContain('newmeasurement')
        expect(p1).toContain('installedequipment')
        expect(p1).not.toContain('ownersheet')

        // page 2 is the owner sheet, fed by the well
        expect(p2).toContain('ownersheet')
        expect(p2).toContain('sitename')
        expect(p2).toContain('pointid')
        expect(p2).toContain('welldepth')
        expect(p2).toContain('mphtft')
        expect(p2).toContain('newmeasurement')
        expect(p2).not.toContain('todays')
        expect(p2).toContain('questionsnmbgwaterlevelsnmtedu')

        // the fixture's three readings, newest first (Nov 5 / Oct 22 / Sep 18)
        const at = (needle: string) => {
          const idx = p2.indexOf(needle)
          expect(idx, `page 2 is missing ${needle}`).toBeGreaterThanOrEqual(0)
          return idx
        }
        expect(at('1120')).toBeLessThan(at('1190'))
        expect(at('1190')).toBeLessThan(at('1240'))

        // none of the retired mock values survive
        for (const stale of ['3486', 'reservewell4', 'ethanmamer', 'wl0085']) {
          expect(p2, `page 2 still prints ${stale}`).not.toContain(stale)
        }
      })()
    },
    660_000
  )
})

/**
 * PR #428 — page frame of the field compilation packet (pages 1–3 + footer).
 *
 * Frozen gate. Written by the planner; the worker runs it and never edits it.
 *
 * What it decides: every page of the packet sits inside one margin frame whose
 * left edge is page 1's left edge (36 pt at standard density) and whose right
 * edge is page 1's right edge (576 pt), the page-1 title is left-aligned at
 * that edge, and every page carries its own `Well ID: X | ( n/4 )` footer.
 *
 * Why these assertions and not the constants: `scale(48,36,24)` means
 * comfortable/standard/compact, so hardcoding 48 would pass a page that does
 * not line up with page 1.
 */
import { pdf } from '@react-pdf/renderer'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { createFieldCompilationStyles } from '@/components/pdf/fieldCompilation/styles'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'

type M = [number, number, number, number, number, number]
const mul = (a: M, b: M): M => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
]
const apply = (m: M, x: number, y: number) => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
]

// Page-1 body box at standard density: 612 - 2 * 36.
const FRAME_LEFT = 36
const FRAME_RIGHT = 612 - 36
const TOL = 2

type PageMeasure = {
  page: number
  texts: { str: string; x0: number; x1: number; y: number }[]
  minTextX: number
  maxTextX1: number
  cardX0: number | null
  cardX1: number | null
}

async function measurePacket(): Promise<PageMeasure[]> {
  const fixture = buildFieldSheetPageOneFixture({ photos: 3 })
  const blob = await pdf(
    createElement(FieldCompilationNotesPdf, {
      ...fixture,
      hydrographImage: null,
    } as never) as never
  ).toBlob()
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
  }).promise
  const OPS = pdfjsLib.OPS as unknown as Record<string, number>
  const out: PageMeasure[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const tc = await page.getTextContent()
    const texts = (tc.items as never[])
      .filter((i: never) => (i as { str: string }).str?.trim())
      .map((i: never) => {
        const it = i as {
          str: string
          transform: number[]
          width: number
        }
        return {
          str: it.str,
          x0: it.transform[4],
          x1: it.transform[4] + (it.width ?? 0),
          y: it.transform[5],
        }
      })
    const ops = await page.getOperatorList()
    const stack: M[] = [[1, 0, 0, 1, 0, 0]]
    const rects: { x0: number; x1: number; y0: number; y1: number }[] = []
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i]
      if (fn === OPS.save) stack.push([...stack[stack.length - 1]] as M)
      else if (fn === OPS.restore) stack.pop()
      else if (fn === OPS.transform) {
        stack[stack.length - 1] = mul(
          stack[stack.length - 1],
          ops.argsArray[i] as M
        )
      } else if (fn === OPS.constructPath) {
        const args = ops.argsArray[i] as unknown[]
        const bbox = args[2] as Float32Array | undefined
        if (!bbox || bbox.length < 4) continue
        const m = stack[stack.length - 1]
        const pts = [
          apply(m, bbox[0], bbox[1]),
          apply(m, bbox[2], bbox[1]),
          apply(m, bbox[0], bbox[3]),
          apply(m, bbox[2], bbox[3]),
        ]
        const xs = pts.map((q) => q[0])
        const ys = pts.map((q) => q[1])
        const x0 = Math.min(...xs)
        const x1 = Math.max(...xs)
        const y0 = Math.min(...ys)
        const y1 = Math.max(...ys)
        // Cards and tables: wide enough to be a section box. The full-paper
        // background rect (612 x 792) is excluded by the height test, not the
        // width test — a card that wrongly spans the whole page must be seen.
        const fullPaper = x1 - x0 > 605 && y1 - y0 > 700
        if (x1 - x0 > 120 && y1 - y0 > 15 && x1 - x0 < 613 && !fullPaper) {
          rects.push({ x0, x1, y0, y1 })
        }
      }
    }
    out.push({
      page: p,
      texts,
      minTextX: Math.min(...texts.map((t) => t.x0)),
      maxTextX1: Math.max(...texts.map((t) => t.x1)),
      cardX0: rects.length ? Math.min(...rects.map((r) => r.x0)) : null,
      cardX1: rects.length ? Math.max(...rects.map((r) => r.x1)) : null,
    })
  }
  return out
}

describe('PR #428 page frame', () => {
  it('every page shares page 1’s left and right margin', async () => {
    const pages = await measurePacket()
    expect(pages.length).toBeGreaterThanOrEqual(3)
    const findings: string[] = []
    for (const p of pages.slice(0, 3)) {
      if (p.minTextX < FRAME_LEFT - TOL) {
        findings.push(
          `page ${p.page}: leftmost text at x=${p.minTextX.toFixed(1)} < ${FRAME_LEFT}`
        )
      }
      if (p.cardX1 !== null && p.cardX1 > FRAME_RIGHT + TOL) {
        findings.push(
          `page ${p.page}: card right edge x=${p.cardX1.toFixed(1)} > ${FRAME_RIGHT}`
        )
      }
      if (p.cardX0 !== null && p.cardX0 < FRAME_LEFT - TOL) {
        findings.push(
          `page ${p.page}: card left edge x=${p.cardX0.toFixed(1)} < ${FRAME_LEFT}`
        )
      }
    }
    expect(findings).toEqual([])
  })

  it('page 1’s title is left-aligned at the frame edge', async () => {
    const [p1] = await measurePacket()
    const title = p1.texts.find((t) =>
      t.str.toLowerCase().includes('field compilation notes')
    )
    expect(title, 'page-1 title text not found').toBeTruthy()
    expect(title!.x0).toBeGreaterThan(FRAME_LEFT - TOL)
    expect(title!.x0).toBeLessThan(FRAME_LEFT + 40)
  })

  it('the date stamp ends at the frame’s right edge on every page', async () => {
    const pages = await measurePacket()
    const findings: string[] = []
    for (const p of pages) {
      // The date is the only right-aligned item in the top band; page 1 also
      // has a right-aligned easting/northing pair, so take the topmost.
      const top = p.texts
        .filter((t) => t.y > 740)
        .sort((a, b) => b.x1 - a.x1)[0]
      if (!top) {
        findings.push(`page ${p.page}: no top-band text`)
        continue
      }
      if (Math.abs(top.x1 - FRAME_RIGHT) > 6) {
        findings.push(
          `page ${p.page}: top-band right edge x=${top.x1.toFixed(1)} vs ${FRAME_RIGHT}`
        )
      }
    }
    expect(findings).toEqual([])
  })

  it('every page carries its own footer page number', async () => {
    const pages = await measurePacket()
    const findings: string[] = []
    for (const p of pages) {
      const joined = p.texts.map((t) => t.str).join(' ')
      const m = joined.match(/\(\s*(\d+)\s*\/\s*(\d+)\s*\)/)
      if (!m) {
        findings.push(`page ${p.page}: no ( n/N ) footer`)
        continue
      }
      if (Number(m[1]) !== p.page) {
        findings.push(
          `page ${p.page}: footer says ( ${m[1]}/${m[2]} )`
        )
      }
      if (Number(m[2]) !== pages.length) {
        findings.push(
          `page ${p.page}: footer total ${m[2]} vs ${pages.length} pages`
        )
      }
    }
    expect(findings).toEqual([])
  })

  it('the hydrograph box is half a page tall, full frame width', () => {
    const styles = createFieldCompilationStyles('standard')
    const image = styles.hydrographImage as {
      width?: string | number
      height?: number
      objectFit?: string
    }
    expect(image.width).toBe('100%')
    // Half of LETTER (792); never below a third (264).
    expect(image.height).toBeGreaterThanOrEqual(264)
    expect(image.height).toBeLessThanOrEqual(396)
    expect(image.height).toBe(396)
  })
})

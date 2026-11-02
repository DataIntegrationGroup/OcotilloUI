/**
 * Golden-master gate for fieldCompilation PDF renders.
 *
 * Proves photo rendering differs from non-photo (core requirement) and
 * provides deterministic comparison via normalised byte hashing.
 *
 * Run: npx vitest run src/test/tools/renderFieldCompilationPdf.test.ts
 */

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { FieldCompilationNotesPdf } from '@/components/pdf/fieldCompilation/page'
import { buildSensorDeploymentRows } from '@/utils/SensorDeploymentRows'
import { makeContact, makeObservations, makeSensors, makeWell } from '@/test/fixtures/fieldCompilationPdfSample'

// ─── Paths (workspace level, not inside repo) ─────────────────────────────
const REPO_ROOT = process.cwd()
const GOLDEN_JSON = join(REPO_ROOT, 'src/test/tools/fixtures/fieldCompilation-golden.json')
const AUDIT_ROOT = process.env.PDF_AUDIT_ROOT || join(homedir(), 'workspace', 'NMBG', 'tasks', 'preview-compilation', 'audit', 'pdf-refactor-2026-11-01')
const GOLDEN_DIR  = join(AUDIT_ROOT, 'golden')

// ─── PHOTO_A fixture (4x4 red PNG — ~423 B in react-pdf output) ──────────
const PHOTO_A = {
  id: 1,
  name: 'PHOTO-A',
  label: 'PHOTO-A',
  mime_type: 'image/png',
  signed_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  created_at: '2026-10-01T00:00:00Z',
}

// ─── Normalisation — covers ALL drift fields ─────────────────────────────
function normalise(buffer: Buffer): Buffer {
  return Buffer.from(
    buffer.toString('latin1')
      // Date strings (CreationDate, ModifiedDate)
      .replace(/\(D:\d{14}Z\)/g, '(D:00000000000000Z)')
      // /ID trailers (two fields per file — both fields in one pattern)
      .replace(/\/ID \[<[0-9a-fA-F]{32}> <[0-9a-fA-F]{32}>\]/g, '/ID [<' + '0'.repeat(32) + '> <' + '0'.repeat(32) + '>]')
      // Document title: buildPdfFilename() appends randomUUID().slice(0,8).
      // It appears BOTH as the /Title info key and as a bare string object
      // ("(<well>_1a2b3c4d.pdf)"), so match the token, not the key.
      .replace(/_[0-9a-f]{8}\.pdf/g, '_00000000.pdf')
      // Title field with random 8-hex token (randomUUID().slice(0,8))
      .replace(/\/Title \([^)]+\)/g, '/Title (_00000000.pdf)'),
    'latin1'
  )
}

function byteHash(buffer: Buffer): string {
  return createHash('sha256').update(normalise(buffer)).digest('hex')
}

// pageCount: count page objects only. "/Type /Pages" is the single page-tree
// root, not a page — including it inflated every result by exactly 1.
function pageCount(buffer: Buffer): number {
  const text = buffer.toString('latin1')
  return (text.match(/\/Type\s*\/Page(?![s])/g) || []).length
}

// Count embedded images in PDF stream
function imageCount(buffer: Buffer): number {
  const text = buffer.toString('latin1')
  let count = 0
  let idx = 0
  while (true) {
    idx = text.indexOf('/Subtype /Image', idx)
    if (idx === -1) break
    count++
    idx += '/Subtype /Image'.length
  }
  return count
}

// ─── Config definitions ─────────────────────────────────────────────────
interface RenderConfig {
  name: string
  showPhotos: boolean
  density: 'standard' | 'compact'
  firstPageOnly: boolean
}

const CONFIGS: RenderConfig[] = [
  { name: 'A', showPhotos: true,  density: 'standard',  firstPageOnly: false },
  { name: 'B', showPhotos: false, density: 'standard',  firstPageOnly: false },
  { name: 'C', showPhotos: true,  density: 'compact',   firstPageOnly: false },
  { name: 'D', showPhotos: true,  density: 'standard',  firstPageOnly: true  },
]

// ─── Render helper ──────────────────────────────────────────────────────
interface CaptureResult {
  configName: string
  pageCount: number
  imageCount: number
  byteSize: number
  byteHash: string
}

// ─── Golden comparison (exact — no tolerance) ───────────────────────────
// The normaliser strips every known non-deterministic field (/CreationDate,
// /ID, random /Title token) and the render clock is pinned by the fake Date
// timer below, so any remaining difference is a real content change.
// Do not replace these with toBeCloseTo: a tolerance hides exactly the
// sub-50-byte style regressions this gate exists to catch.
function assertMatchesGolden(
  result: CaptureResult,
  golden: CaptureResult,
  label: string
) {
  expect(result.byteSize, `${label}: byteSize drift`).toBe(golden.byteSize)
  expect(result.byteHash, `${label}: byteHash drift`).toBe(golden.byteHash)
  expect(result.pageCount, `${label}: pageCount drift`).toBe(golden.pageCount)
  expect(result.imageCount, `${label}: imageCount drift`).toBe(golden.imageCount)
}

async function renderAndCapture(cfg: RenderConfig): Promise<CaptureResult> {
  const buf = (await renderToBuffer(
    // @ts-ignore — FieldCompilationNotesPdf prop types are intentionally loose
    createElement(FieldCompilationNotesPdf, {
      well: makeWell(),
      contacts: [makeContact()],
      assets: cfg.showPhotos ? [PHOTO_A] : [],
      observations: makeObservations(),
      sensorDeployments: buildSensorDeploymentRows(makeSensors() as any, [
        { id: 11, name: 'HOBO-01', model: 'U20-001-04', sensor_type: 'pressure transducer', notes: 'Downloaded 2026-05-20', thing_id: 1 },
        { id: 12, name: 'Unattached spare', model: 'U20-001-04', sensor_type: 'pressure transducer', thing_id: 1 },
      ] as any),
      hydrographImage: null,
      sampleMethodsBySampleId: {},
      includeConfidentialContacts: false,
      density: cfg.density,
      firstPageOnly: cfg.firstPageOnly,
      showPhotos: cfg.showPhotos,
    }) as any
  ) as Buffer)

  // Save PDF to audit directory
  const pdfPath = join(GOLDEN_DIR, `${cfg.name}.pdf`)
  mkdirSync(GOLDEN_DIR, { recursive: true })
  writeFileSync(pdfPath, buf)

  return {
    configName: cfg.name,
    pageCount: pageCount(buf),
    imageCount: imageCount(buf),
    byteSize: buf.length,
    byteHash: byteHash(buf),
  }
}

// ─── Golden management (committed, read-only) ────────────────────────────
function loadGolden(): Record<string, CaptureResult> | null {
  try {
    const raw = readFileSync(GOLDEN_JSON, 'utf-8')
    const parsed = JSON.parse(raw)
    // Only return if A exists (golden is valid)
    return parsed.A ? parsed : null
  } catch {
    return null
  }
}

async function writeGolden(results: Map<string, CaptureResult>) {
  mkdirSync(join(GOLDEN_JSON, '..'), { recursive: true })
  const obj: Record<string, CaptureResult> = {}
  for (const [key, val] of results) {
    obj[key] = { ...val }
  }
  writeFileSync(GOLDEN_JSON, JSON.stringify(obj, null, 2))
}

// ─── Gate assertions ────────────────────────────────────────────────────
async function runAssertions(results: Map<string, CaptureResult>) {
  const a = results.get('A')!
  const b = results.get('B')!
  const c = results.get('C')!
  const d = results.get('D')!

  // (b) All configs distinct sizes (normalisation handles drift fields)
  const hashes = new Set<string>()
  for (const [, res] of results) {
    if (hashes.has(res.byteHash)) {
      throw new Error('HASH COLLISION: ' + res.configName)
    }
    hashes.add(res.byteHash)
  }

  // (c) Photos increase size; A ≠ C (standard vs compact)
  expect(a.byteSize, 'Photos add bytes').toBeGreaterThan(b.byteSize)
  expect(a.byteSize, 'Standard != Compact layout').not.toEqual(c.byteSize)

  // Photo coverage: A/C/D must have images, B must not
  expect(a.imageCount, 'A has images').toBeGreaterThanOrEqual(1)
  expect(b.imageCount, 'B has no images').toBe(0)
  expect(c.imageCount, 'C has images').toBeGreaterThanOrEqual(1)
  expect(d.imageCount, 'D has images').toBeGreaterThanOrEqual(1)

  // pageCount: D firstPageOnly is smaller than full docs
  expect(d.pageCount, 'D firstPageOnly has fewer pages').toBeLessThan(a.pageCount)

  // Golden comparison is NOT done here — see the dedicated golden test below,
  // which is the only place that may read or write golden.json.
  return results
}

// ─── Main test suite ────────────────────────────────────────────────────
// The renderer stamps "today" into the page text (formatAppDate) and into
// /CreationDate. Without pinning the clock the golden is only valid on the
// day it was written, which is why the previous golden churned on every run.
// Fake ONLY Date so timers/promises inside react-pdf stay real.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'))
})
afterAll(() => {
  vi.useRealTimers()
})

describe('fieldCompilation PDF golden-master gate', () => {
  it('renders four configs and validates content differences', async () => {
    const results = new Map<string, CaptureResult>()
    for (const cfg of CONFIGS) {
      results.set(cfg.name, await renderAndCapture(cfg))
    }

    // Print hashes for D0 tracking
    for (const [name, res] of results) {
      console.log(`${name}: size=${res.byteSize} pages=${res.pageCount} images=${res.imageCount} hash=${res.byteHash.substring(0,16)}...`)
    }

    await runAssertions(results)
    return results
  }, 60_000)

  it('compares against committed golden (never writes unless UPDATE_GOLDEN=1)', async () => {
    const results = new Map<string, CaptureResult>()
    for (const cfg of CONFIGS) {
      results.set(cfg.name, await renderAndCapture(cfg))
    }

    // Regeneration is an explicit, reviewed act: UPDATE_GOLDEN=1 npx vitest run <this file>
    // The default path compares FIRST and never touches golden.json, so a green
    // run can only mean the committed baseline already matched.
    if (process.env.UPDATE_GOLDEN === '1') {
      await writeGolden(results)
      console.log('[golden] regenerated — review the diff before committing')
      return
    }

    const golden = loadGolden()
    expect(golden, 'golden.json missing — regenerate with UPDATE_GOLDEN=1').not.toBeNull()
    expect(Object.keys(golden!).sort()).toEqual(['A', 'B', 'C', 'D'])

    for (const [name, res] of results) {
      assertMatchesGolden(res, golden![name], name)
    }
  }, 60_000)

  it('verifies D0 determinism: two in-process renders agree on size', async () => {
    const results = new Map<string, CaptureResult>()
    for (const cfg of CONFIGS) {
      results.set(cfg.name, await renderAndCapture(cfg))
    }

    // Second pass — verify sizes match
    const a1 = results.get('A')!
    const d1 = results.get('D')!

    const a2 = await renderAndCapture(CONFIGS[0])
    const d2 = await renderAndCapture(CONFIGS[3])

    // Clock is pinned and the normaliser covers every drift field, so two
    // renders must agree byte for byte — not merely on size.
    assertMatchesGolden(a2, a1, 'A render 2')
    assertMatchesGolden(d2, d1, 'D render 2')
  }, 60_000)
})

// ─── D2 falsifiability ──────────────────────────────────────────────────
// The gate earns its runtime only if a wrong result fails it. Instead of
// tampering with the committed golden on disk (which risks leaving the repo
// dirty), drive the comparator directly: a fresh render must MATCH the
// golden, and perturbed copies of that same golden must FAIL.
describe('D2 falsifiability', () => {
  it('matches the committed golden and rejects perturbed copies of it', async () => {
    const golden = loadGolden()
    expect(golden, 'golden.json missing — regenerate with UPDATE_GOLDEN=1').not.toBeNull()

    const res = await renderAndCapture(CONFIGS[0])

    // Positive control: if this does not pass, the checks below prove nothing.
    assertMatchesGolden(res, golden!.A, 'A')

    // One byte of size drift
    expect(() => assertMatchesGolden(res, { ...golden!.A, byteSize: golden!.A.byteSize + 1 }, 'A'))
      .toThrow(/byteSize drift/)

    // Same size, different content
    const flipped = golden!.A.byteHash.replace(/^./, (c) => (c === '0' ? '1' : '0'))
    expect(() => assertMatchesGolden(res, { ...golden!.A, byteHash: flipped }, 'A'))
      .toThrow(/byteHash drift/)

    // A page silently dropped
    expect(() => assertMatchesGolden(res, { ...golden!.A, pageCount: golden!.A.pageCount - 1 }, 'A'))
      .toThrow(/pageCount drift/)
  }, 60_000)
})

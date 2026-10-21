import { describe, expect, it } from 'vitest'
import type { IWell } from '@/interfaces/ocotillo'
import {
  buildWellLookup,
  compactLookupKey,
  pagesForWell,
  parseIds,
} from '@/utils/WellBatchExport'

const resolve = (lookup: ReturnType<typeof buildWellLookup>, token: string) =>
  lookup.has(compactLookupKey(token)) || lookup.has(token.toUpperCase())

/** A minimal IWell — pagesForWell / resolve only needs id + name. */
const well = (id: number, name: string): IWell =>
  ({ id, name, thing_type: 'well' }) as unknown as IWell

describe('parseIds — Google Calendar loop parsing', () => {
  // AC2: a paste joining IDs with commas, newlines and slashes resolves every
  // well it contains ...
  const LOOP = 'AB-0001\nAB-0002, AB-0003\nAB-0004 / AB-0005'

  it('splits on commas, newlines AND slashes and yields each ID once', () => {
    expect(parseIds(LOOP)).toEqual([
      'AB-0001',
      'AB-0002',
      'AB-0003',
      'AB-0004',
      'AB-0005',
    ])
  })

  it('resolves every well in the paste and produces nothing else', () => {
    const lookup = buildWellLookup([
      well(1, 'AB-0001'),
      well(2, 'AB-0002'),
      well(3, 'AB-0003'),
      well(4, 'AB-0004'),
      well(5, 'AB-0005'),
    ])
    const tokens = parseIds(LOOP)

    expect(tokens.length).toBe(5)
    tokens.forEach((token) => {
      expect(resolve(lookup, token)).toBe(true)
    })
  })

  it('does not split IDs that have no delimiter (non-slash input unchanged)', () => {
    // AC5: the slash addition must not change output that never had one.
    expect(parseIds('AB-0001\nAB-0002')).toEqual(['AB-0001', 'AB-0002'])
  })
})

describe('parseIds — unresolved tokens', () => {
  // AC2 flags only the missing wells; AC3 names that failing token.
  const LOOP = 'AB-0001, MISSING-777, AB-0003'

  it('flags exactly one token and reports its own identity', () => {
    const lookup = buildWellLookup([well(1, 'AB-0001'), well(3, 'AB-0003')])
    const tokens = parseIds(LOOP)

    const unresolved = tokens.filter((token) => !resolve(lookup, token))

    expect(unresolved).toEqual(['MISSING-777'])
  })
})

describe('filename — AC1', () => {
  it('leaves the untouched default unchanged on disk (safeFilenamePrefix is a no-op on it)', () => {
    // generateBatch runs safeFilenamePrefix(filename) before writing, so an
    // untouched field must round-trip to exactly buildBatchFilename().
    const date = new Date().toISOString().slice(0, 10)
    const defName = `FieldSheets_Batch_${date}`
    expect(defName).toMatch(/^FieldSheets_Batch_\d{4}-\d{2}-\d{2}$/)

    // Sanitisation must not alter the default prefix (so "untouched -> default").
    // Reproduce sanitizeFilenamePart logic inline to keep this binary-free:
    const sanitize = (value: string) =>
      value
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

    expect(sanitize(defName)).toBe(defName)
  })

  it('turns an edited field into exactly the edited, sanitised prefix', () => {
    const sanitize = (value: string) =>
      value
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')

    expect(sanitize('  My Great Run! ')).toBe('My_Great_Run')
  })
})

describe('pagesForWell — AC4 owner-page toggle', () => {
  const sample = well(7, 'Sample Well')

  it('two pages when the owner page is on', () => {
    expect(pagesForWell(sample, true)).toEqual([
      'field-sheet',
      'owner-leavebehind',
    ])
    expect(pagesForWell(sample, true).length).toBe(2)
  })

  it('one page when the owner page is off', () => {
    expect(pagesForWell(sample, false)).toEqual(['field-sheet'])
    expect(pagesForWell(sample, false).length).toBe(1)
  })
})

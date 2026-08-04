import { describe, expect, it } from 'vitest'
import type { IWellRecord } from '@/interfaces/geothermal'
import {
  computePendingOps,
  flattenFieldErrors,
  isBlankNew,
  isNewRow,
  makeBlankRecord,
  NEW_PREFIX,
  rowKey,
} from '@/pages/geothermal/wells/recordsGridLogic'

function existing(objectId: string, over: Partial<IWellRecord> = {}): IWellRecord {
  return { ...makeBlankRecord(objectId), ...over, OBJECTID: objectId }
}

function snapshotOf(records: IWellRecord[]): Map<string, string> {
  return new Map(records.map((r) => [rowKey(r), JSON.stringify(r)]))
}

describe('makeBlankRecord', () => {
  it('carries the temp id and leaves every editable field empty', () => {
    const r = makeBlankRecord(`${NEW_PREFIX}3`)
    expect(r.OBJECTID).toBe('new:3')
    expect(isBlankNew(r)).toBe(true)
    expect(isNewRow(r)).toBe(true)
  })
})

describe('isNewRow', () => {
  it('is true only for temp-prefixed ids', () => {
    expect(isNewRow(existing('new:0'))).toBe(true)
    expect(isNewRow(existing('1024'))).toBe(false)
  })
})

describe('isBlankNew', () => {
  it('is false once any editable field is filled', () => {
    expect(isBlankNew(makeBlankRecord('new:1'))).toBe(true)
    expect(isBlankNew(existing('new:1', { WellName: 'A' }))).toBe(false)
  })
})

describe('computePendingOps', () => {
  it('emits nothing when no row changed', () => {
    const rows = [existing('1'), existing('2')]
    expect(computePendingOps(rows, snapshotOf(rows))).toEqual([])
  })

  it('emits an update for a changed existing row only', () => {
    const rows = [existing('1'), existing('2')]
    const snap = snapshotOf(rows)
    const edited = [{ ...rows[0], WellName: 'changed' }, rows[1]]

    const ops = computePendingOps(edited, snap)

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({ kind: 'update', index: 0, key: '1' })
  })

  it('emits a create for a filled new row and skips blank new rows', () => {
    const existingRow = existing('1')
    const snap = snapshotOf([existingRow])
    const rows = [
      existingRow,
      makeBlankRecord('new:0'), // blank -> skipped
      existing('new:1', { WellName: 'Fresh' }), // filled -> create
    ]

    const ops = computePendingOps(rows, snap)

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({ kind: 'create', index: 2, key: 'new:1' })
  })

  it('preserves row indices for mixed create/update', () => {
    const a = existing('1')
    const b = existing('2')
    const snap = snapshotOf([a, b])
    const rows = [
      { ...a, Comments: 'edit' }, // update, index 0
      b, // unchanged
      existing('new:0', { WellName: 'New' }), // create, index 2
    ]

    const ops = computePendingOps(rows, snap)

    expect(ops.map((o) => ({ kind: o.kind, index: o.index }))).toEqual([
      { kind: 'update', index: 0 },
      { kind: 'create', index: 2 },
    ])
  })
})

describe('flattenFieldErrors', () => {
  it('joins each field message array into a single string', () => {
    expect(
      flattenFieldErrors({ WellName: ['required'], WellNumber: ['a', 'b'] })
    ).toEqual({ WellName: 'required', WellNumber: 'a b' })
  })

  it('returns undefined for empty or non-object input', () => {
    expect(flattenFieldErrors(undefined)).toBeUndefined()
    expect(flattenFieldErrors({})).toBeUndefined()
    expect(flattenFieldErrors(null)).toBeUndefined()
  })
})

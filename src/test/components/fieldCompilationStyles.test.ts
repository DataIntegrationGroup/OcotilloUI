import { describe, expect, it } from 'vitest'
import { createFieldCompilationStyles } from '@/components/pdf/fieldCompilation/styles'

// Transcript of the 81 top-level style keys in styles.ts @ ca75ffdc (pre-split).
// Do not regenerate this list from the split modules; it is the baseline.
const EXPECTED_KEYS = [
  'page',
  'pageDate',
  'footer',
  'footerText',
  'header',
  'title',
  'headerDate',
  'content',
  'columnContainer',
  'contentColumn',
  'photoColumn',
  'rowRow',
  'photoCell',
  'leftColumn',
  'rightColumn',
  'section',
  'sectionCard',
  'sectionTitleBar',
  'accentBar',
  'topGrid',
  'topGridColumn',
  'line',
  'label',
  'contactsRow',
  'contactColumn',
  'contactDetails',
  'sectionTitle',
  'noteText',
  'metricRow',
  'metricCell',
  'table',
  'tableHeader',
  'tableRow',
  'tableRowLast',
  'cell',
  'cellHeader',
  'compactCell',
  'compactCellHeader',
  'imageNoteRow',
  'imageWrap',
  'imageWrapFull',
  'image',
  'imageLabel',
  'notePad',
  'notePadLine',
  'preVisitPad',
  'ruledSlot',
  'emptyImageState',
  'pageTitle',
  'hydrographImage',
  'hydrographEmptyState',
  'cutMethodBox',
  'cutMethodEquation',
  'cutMethodHint',
  'cutMethodRow',
  'cutMethodField',
  'cutMethodLabel',
  'fillLine',
  'cutMethodTable',
  'cutMethodTableRow',
  'cutMethodTableRowLast',
  'cutMethodTableLabelCell',
  'cutMethodTableValueCell',
  'cutMethodTableValueCellLast',
  'cutMethodTableHeaderCell',
  'newMeasurementBox',
  'newMeasurementHeaderRow',
  'newMeasurementTitle',
  'newMeasurementPrev',
  'newMeasurementFieldRow',
  'newMeasurementField',
  'newMeasurementFieldLabel',
  'newWriteLine',
  'newGridRow',
  'newGridHeaderCell',
  'newGridLabelCell',
  'newGridValueCell',
  'notesPad',
  'notesPadLine',
  'blankPageBody',
  'blankPageText',
  // Added after the pre-split baseline (intentional, each landed with a layout change):
  // pageFrame + notesLineStack + photoSlotPlaceholder (page-1 reflow / zero-photo slots),
  // hydrographFrame / hydrographFrameEmpty / hydrographGraphic / hydrographEmptyText
  // (2026-11-15 page-2 fixed-height hydrograph container).
  'pageFrame',
  'notesLineStack',
  'photoSlotPlaceholder',
  'hydrographFrame',
  'hydrographFrameEmpty',
  'hydrographGraphic',
  'hydrographEmptyText',
]

const DENSITIES = ['comfortable'] as const

describe('fieldCompilation style key set (pre-split pin)', () => {
  it('pins 88 keys', () => {
    expect(EXPECTED_KEYS).toHaveLength(88)
    expect(new Set(EXPECTED_KEYS).size).toBe(88)
  })

  for (const density of DENSITIES) {
    it(`exposes exactly the pinned keys at ${density}`, () => {
      const styles = createFieldCompilationStyles(density)
      expect(Object.keys(styles).sort()).toEqual([...EXPECTED_KEYS].sort())
    })
  }

  it('keeps comfortable density scaling and the column model intact', () => {
    const comfortable = createFieldCompilationStyles('comfortable')
    // L9: density narrowed to one member, so standard/compact arms collapsed;
    // every call now returns the comfortable sizing (verified verbatim against
    // the numbers that were already correct for the comfortable arm).
    expect(comfortable.page.fontSize).toBe(9.5)
    expect(comfortable.footer.bottom).toBe(12)
    expect(comfortable.content.gap).toBe(10)
    expect(comfortable.columnContainer.gap).toBe(2)
    expect(comfortable.contentColumn.flex).toBe(2)
    expect(comfortable.photoColumn.flex).toBe(1)
    expect(comfortable.leftColumn.width).toBe('57%')
    expect(comfortable.rightColumn.width).toBe('43%')
    expect(comfortable.table.borderWidth).toBe(1)
  })
})

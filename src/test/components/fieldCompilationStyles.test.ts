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
]

const DENSITIES = ['comfortable', 'standard', 'compact'] as const

describe('fieldCompilation style key set (pre-split pin)', () => {
  it('pins 81 keys', () => {
    expect(EXPECTED_KEYS).toHaveLength(81)
    expect(new Set(EXPECTED_KEYS).size).toBe(81)
  })

  for (const density of DENSITIES) {
    it(`exposes exactly the pinned keys at ${density}`, () => {
      const styles = createFieldCompilationStyles(density)
      expect(Object.keys(styles).sort()).toEqual([...EXPECTED_KEYS].sort())
    })
  }

  it('keeps density scaling and the column model intact', () => {
    const comfortable = createFieldCompilationStyles('comfortable')
    const standard = createFieldCompilationStyles('standard')
    const compact = createFieldCompilationStyles('compact')
    expect(comfortable.page.fontSize).toBe(9.5)
    expect(standard.page.fontSize).toBe(9)
    expect(compact.page.fontSize).toBe(8.5)
    expect(standard.footer.bottom).toBe(10)
    expect(compact.footer.bottom).toBe(8)
    expect(standard.content.gap).toBe(10)
    expect(standard.columnContainer.gap).toBe(2)
    expect(standard.contentColumn.flex).toBe(2)
    expect(standard.photoColumn.flex).toBe(1)
    expect(standard.leftColumn.width).toBe('57%')
    expect(standard.rightColumn.width).toBe('43%')
    expect(standard.table.borderWidth).toBe(1)
  })
})

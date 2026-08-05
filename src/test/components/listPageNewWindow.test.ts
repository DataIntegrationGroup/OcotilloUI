// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isNewWindowClick, openInNewWindow } from '@/components/ListPage'
import { buildWellShowPath } from '@/utils/wellPublicUrls'

// BDMS-903: well list rows must be openable in a separate window so several
// well detail pages can be reviewed side by side.
describe('isNewWindowClick', () => {
  it('treats ctrl, meta and middle clicks as new-window intent', () => {
    expect(isNewWindowClick({ ctrlKey: true })).toBe(true)
    expect(isNewWindowClick({ metaKey: true })).toBe(true)
    expect(isNewWindowClick({ button: 1 })).toBe(true)
  })

  it('leaves plain and shift clicks to in-place navigation', () => {
    expect(isNewWindowClick({ button: 0 })).toBe(false)
    // Shift belongs to the DataGrid row range selection.
    expect(isNewWindowClick({ button: 0, ctrlKey: false, metaKey: false })).toBe(
      false
    )
  })
})

describe('openInNewWindow', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the path in a new browsing context without an opener handle', () => {
    const opened = { opener: window } as unknown as Window
    const open = vi.fn().mockReturnValue(opened)
    vi.stubGlobal('open', open)

    openInNewWindow(buildWellShowPath('abc-123'))

    expect(open).toHaveBeenCalledWith(
      '/ocotillo/well/show/abc-123',
      '_blank',
      'noopener,noreferrer'
    )
    expect(opened.opener).toBeNull()
  })

  it('tolerates a blocked popup', () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null))

    expect(() => openInNewWindow(buildWellShowPath(7))).not.toThrow()
  })
})

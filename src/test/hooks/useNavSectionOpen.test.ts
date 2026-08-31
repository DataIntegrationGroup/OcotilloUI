// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useNavSectionOpen } from '@/hooks/useNavSectionOpen'

describe('useNavSectionOpen', () => {
  it('starts open when the section is already active', () => {
    const { result } = renderHook(() => useNavSectionOpen(true))
    expect(result.current[0]).toBe(true)
  })

  it('starts closed when it is not', () => {
    const { result } = renderHook(() => useNavSectionOpen(false))
    expect(result.current[0]).toBe(false)
  })

  it('opens when navigation moves into the section', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useNavSectionOpen(active),
      { initialProps: { active: false } }
    )

    rerender({ active: true })
    expect(result.current[0]).toBe(true)
  })

  it('collapses on demand while the section is still active', () => {
    // The bug: a group covering the pages you use most could never be closed.
    const { result } = renderHook(() => useNavSectionOpen(true))

    act(() => result.current[1](false))
    expect(result.current[0]).toBe(false)
  })

  it('keeps a manual collapse while moving between pages in the section', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useNavSectionOpen(active),
      { initialProps: { active: true } }
    )

    act(() => result.current[1](false))
    rerender({ active: true })
    expect(result.current[0]).toBe(false)
  })

  it('stays open when navigation leaves the section', () => {
    // The bug: every group trigger is also a link, so closing on navigate-away
    // made opening one group collapse the others.
    const { result, rerender } = renderHook(
      ({ active }) => useNavSectionOpen(active),
      { initialProps: { active: true } }
    )

    rerender({ active: false })
    expect(result.current[0]).toBe(true)
  })

  it('leaves a group the user closed closed when navigating elsewhere', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useNavSectionOpen(false),
      { initialProps: { active: false } }
    )

    rerender({ active: false })
    expect(result.current[0]).toBe(false)
  })
})

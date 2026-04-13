const KEY = 'ocotillo_search_history'
const MAX = 8

export const useSearchHistory = () => {
  const get = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]')
    } catch {
      return []
    }
  }

  const add = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    const existing = get().filter((q) => q !== trimmed)
    localStorage.setItem(KEY, JSON.stringify([trimmed, ...existing].slice(0, MAX)))
  }

  const clear = () => localStorage.removeItem(KEY)

  return { get, add, clear }
}

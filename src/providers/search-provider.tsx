import { createContext, useContext, useState, type ReactNode } from 'react'
import { SearchModal } from '@/components/SearchModal'

interface SearchContextValue {
  openSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider')
  }
  return context
}

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)

  const openSearch = () => setOpen(true)

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </SearchContext.Provider>
  )
}

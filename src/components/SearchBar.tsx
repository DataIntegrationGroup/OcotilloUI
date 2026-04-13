import { useEffect } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { Search } from 'react-flaticons'
import { useSearch } from '@/providers/search-provider'

export const SearchBar = () => {
  const theme = useTheme()
  const { openSearch } = useSearch()
  const isMac = navigator.platform.toUpperCase().includes('MAC')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmdKey = isMac ? e.metaKey : e.ctrlKey
      if (cmdKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isMac, openSearch])

  return (
    <Box
      onClick={openSearch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') openSearch()
      }}
      sx={{
        backgroundColor: 'background.paper',
        flexGrow: 1,
        borderRadius: '5px',
        maxWidth: '50ch',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        cursor: 'text',
        border: 1,
        borderColor: 'divider',
        '&:hover': { borderColor: 'text.disabled' },
      }}
    >
      <Search color={theme.palette.text.secondary} size={16} />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flex: 1, userSelect: 'none', fontSize: 14 }}
      >
        Search
      </Typography>
      <kbd
        aria-hidden={true}
        style={{
          display: 'inline-block',
          userSelect: 'none',
          whiteSpace: 'pre',
          background: theme.palette.action.hover,
          color: theme.palette.text.secondary,
          paddingLeft: 4,
          paddingRight: 4,
          paddingTop: 2,
          paddingBottom: 2,
          lineHeight: '20px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          letterSpacing: isMac ? '1.5px' : '0.5px',
          borderRadius: '7px',
        }}
      >
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
    </Box>
  )
}

export default SearchBar

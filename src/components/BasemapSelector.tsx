import React from 'react'
import { Box, ButtonBase, Typography } from '@mui/material'
import { MAPBOX_BASEMAPS } from '@/constants'
import { settings } from '@/settings'

interface BasemapSelectorProps {
  value: string
  onChange: (nextValue: string) => void
}

const PREVIEW_CENTER = '-106.2,34.4,6.2,0'
const PREVIEW_SIZE = '220x110'

const previewUrlForStyle = (styleUri: string): string | null => {
  if (!settings.mapboxToken) return null
  const prefix = 'mapbox://styles/'
  if (!styleUri.startsWith(prefix)) return null

  const stylePath = styleUri.slice(prefix.length)
  return `https://api.mapbox.com/styles/v1/${stylePath}/static/${PREVIEW_CENTER}/${PREVIEW_SIZE}?access_token=${settings.mapboxToken}`
}

export const BasemapSelector: React.FC<BasemapSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 0.6,
      }}
    >
      {MAPBOX_BASEMAPS.map((basemap) => (
        <ButtonBase
          key={basemap.uri}
          onClick={() => onChange(basemap.uri)}
          sx={{
            display: 'block',
            textAlign: 'left',
            borderRadius: 1,
            overflow: 'hidden',
            border: '2px solid',
            borderColor: value === basemap.uri ? 'primary.main' : 'divider',
            backgroundColor: 'background.default',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              aspectRatio: '2 / 1',
              background:
                'linear-gradient(135deg, rgba(20,48,78,0.18), rgba(210,180,140,0.3))',
            }}
          >
            {previewUrlForStyle(basemap.uri) && (
              <Box
                component="img"
                src={previewUrlForStyle(basemap.uri) || undefined}
                alt={basemap.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}
            <Box
              sx={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                px: 0.65,
                py: 0.45,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.62))',
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                {basemap.title}
              </Typography>
            </Box>
          </Box>
        </ButtonBase>
      ))}
    </Box>
  )
}

export default BasemapSelector

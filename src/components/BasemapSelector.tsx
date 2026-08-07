import { Box, ButtonBase, Typography } from '@mui/material'
import React from 'react'
import { Map } from 'react-map-gl/maplibre'
import { BASEMAPS, type BasemapDefinition } from '@/basemaps'

interface BasemapSelectorProps {
  value: string
  onChange: (nextValue: string) => void
}

const PREVIEW_VIEW_STATE = {
  longitude: -106.2,
  latitude: 34.4,
  zoom: 5.2,
}

/**
 * Thumbnail for a single basemap. Raster basemaps can show one static tile,
 * which costs nothing to render. Vector basemaps have no static endpoint, so
 * they render a small non-interactive map instead — these only mount while the
 * selector is on screen, keeping the number of live WebGL contexts low.
 */
const BasemapPreview = ({ basemap }: { basemap: BasemapDefinition }) => {
  if (basemap.previewUrl) {
    return (
      <Box
        component="img"
        src={basemap.previewUrl}
        alt={basemap.title}
        loading="lazy"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    )
  }

  return (
    <Map
      initialViewState={PREVIEW_VIEW_STATE}
      mapStyle={basemap.style}
      interactive={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    />
  )
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
      {BASEMAPS.map((basemap) => (
        <ButtonBase
          key={basemap.id}
          onClick={() => onChange(basemap.id)}
          sx={{
            display: 'block',
            textAlign: 'left',
            borderRadius: 1,
            overflow: 'hidden',
            border: '2px solid',
            borderColor: value === basemap.id ? 'primary.main' : 'divider',
            backgroundColor: 'background.default',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              aspectRatio: '2 / 1',
              background:
                'linear-gradient(135deg, rgba(20,48,78,0.18), rgba(210,180,140,0.3))',
              // The preview map paints its own canvas; keep pointer events on
              // the enclosing button so the whole tile stays clickable.
              '& canvas': { pointerEvents: 'none' },
            }}
          >
            <BasemapPreview basemap={basemap} />
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

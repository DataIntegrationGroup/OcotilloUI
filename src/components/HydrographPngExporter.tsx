import { useEffect, useRef } from 'react'
import { useTheme, Box } from '@mui/material'
import { IHydrographDatasource, IHydrographOptions } from '@/interfaces/st2'
import {
  Hydrograph,
  HydrographHandle,
} from '@/components/Hydrographs/Hydrograph'

export const HydrographPngExporter = ({
  datasource,
  options,
  refreshKey,
  onPngReady,
}: {
  datasource: IHydrographDatasource[]
  options?: IHydrographOptions
  refreshKey?: any // bump to force re-render/export
  onPngReady: (pngDataUrl: string) => void
}) => {
  const theme = useTheme()
  const hydrographRef = useRef<HydrographHandle>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const png = hydrographRef.current?.toPngDataUrl({
        pixelRatio: 3,
        backgroundColor: theme.palette.background.paper,
      })

      if (png) {
        onPngReady(png)
      }
    }, 100)

    return () => clearTimeout(t)
  }, [datasource, options, refreshKey, onPngReady, theme])

  return (
    // Off-screen render (still in DOM so canvas works)
    <Box
      sx={{
        position: 'absolute',
        left: -10000,
        top: 0,
        width: 900, // export resolution basis
        height: 400,
        pointerEvents: 'none',
        opacity: 0,
        overflow: 'hidden',
      }}
    >
      <Hydrograph
        ref={hydrographRef}
        datasource={datasource}
        refresh={typeof refreshKey === 'number' ? refreshKey : 0}
        options={options}
        sx={{ width: 900, height: 400 }}
      />
    </Box>
  )
}

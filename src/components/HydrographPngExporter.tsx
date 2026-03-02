import { useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTheme, Box } from '@mui/material'

type HydrographPngExporterProps = {
  option: any // your echarts option object
  refreshKey?: any // bump to force re-render/export
  onPngReady: (pngDataUrl: string) => void
}

export const HydrographPngExporter = ({
  option,
  refreshKey,
  onPngReady,
}: HydrographPngExporterProps) => {
  const theme = useTheme()
  const chartRef = useRef<ReactECharts>(null)

  useEffect(() => {
    // Wait a tick so ECharts has actually painted
    const t = setTimeout(() => {
      const inst = chartRef.current?.getEchartsInstance?.()
      if (!inst) return

      const png = inst.getDataURL({
        type: 'png',
        pixelRatio: 3, // good for PDFs
        backgroundColor: theme.palette.background.paper,
        excludeComponents: ['toolbox'],
      })

      onPngReady(png)
    }, 50)

    return () => clearTimeout(t)
  }, [option, refreshKey, theme, onPngReady])

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
      }}
    >
      <ReactECharts
        ref={chartRef}
        option={{
          ...option,
          animation: false,
          backgroundColor: theme.palette.background.paper,
        }}
        style={{ width: '900px', height: '400px' }}
      />
    </Box>
  )
}

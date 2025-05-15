export const chartOptions: any = {
  animation: false,
  toolbox: {
    feature: {
      dataZoom: [
        { show: true, title: { zoom: 'Zoom In', back: 'Zoom Out' } },
        {
          type: 'inside',
          title: { zoom: 'Zoom In', back: 'Zoom Out' },
          zoomLock: true,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,
          preventDefaultMouseMove: true,
        },
      ],
      restore: {},
      saveAsImage: {},
      dataView: { show: true },
      brush: {
        type: ['lineX', 'clear'],
      },
    },
  },
  grid: {
    right: '5%',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      animation: false,
      label: {
        backgroundColor: '#505765',
      },
    },
  },
  dataZoom: [
    {
      show: true,
      realtime: true,
      start: 0,
      end: 100,
    },
    {
      type: 'inside',
      realtime: true,
      start: 0,
      end: 100,
    },
  ],
  xAxis: {
    type: 'time',
    splitLine: { show: true },
    axisLine: { show: false },
    min: 'dataMin',
    max: 'dataMax',
  },
  yAxis: {
    inverse: true,
    nameLocation: 'center',
    nameGap: 75,
    scale: true,
  },
  brush: {
    outOfBrush: {
      colorAlpha: 0.25,
    },
  },
}

export const getContinuousWaterLevelSeries = (id: string) => ({
  datasetId: id,
  type: 'line',
  name: 'Depth to Water (ST2)',
  encode: { x: 'date', y: 'depth' },
  itemStyle: { color: '#d32f2f' }, // red
  showSymbol: true,
  symbolSize: 6,
})

export const getManualWaterLevelSeries = (id: string) => ({
  datasetId: id,
  type: 'scatter',
  name: 'Depth to Water (Manual)',
  encode: { x: 'date', y: 'depth' },
  itemStyle: { color: '#1976d2' }, // blue
  showSymbol: true,
  symbolSize: 6,
})

export const getUserPointSeries = (id: string) => ({
  datasetId: id,
  type: 'scatter',
  name: 'Your Entry',
  encode: { x: 'date', y: 'depth' },
  itemStyle: { color: '#fbc02d' }, // yellow
  symbolSize: 10,
  showSymbol: true,
})

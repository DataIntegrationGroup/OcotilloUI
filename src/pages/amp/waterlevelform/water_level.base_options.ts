export const baseOption: any = {
  animation: false,
  toolbox: {
    feature: {
      dataZoom: [
        { show: true, title: { zoom: 'Zoom In', back: 'Zoom Out' } },
        { type: 'inside', title: { zoom: 'Zoom In', back: 'Zoom Out' } },
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
    right: '20%',
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

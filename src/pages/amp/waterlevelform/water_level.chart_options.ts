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
      dataView: {
        show: true,
        readOnly: true,
        optionToContent: (opt: any) => {
          const datasetIds = [
            { id: 'continuousWaterLevelDataView', label: 'Continuous' },
            { id: 'manualWaterLevelDataView', label: 'Manual' },
            { id: 'userPointDataView', label: 'Your Entry' },
          ]

          let html = '<div style="padding:10px;">'

          datasetIds.forEach(({ id, label }) => {
            const dataset = opt.dataset.find((ds: any) => ds.id === id)
            if (dataset && dataset.source.length > 0) {
              html += `<h4>${label}</h4>`
              html +=
                '<table style="width:100%;text-align:left;margin-bottom:10px;"><thead><tr><th>Date</th><th>Depth (ft)</th></tr></thead><tbody>'
              dataset.source.forEach((row: any) => {
                html += `<tr><td>${row.date}</td><td>${Number(
                  row.depth
                ).toFixed(2)}</td></tr>`
              })
              html += '</tbody></table>'
            }
          })

          html += '</div>'
          return html
        },
      },
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
  name: 'Continuous Depth to Water BGS (ft)',
  encode: { x: 'date', y: 'depth' },
  itemStyle: { color: '#d32f2f' }, // red
  showSymbol: true,
  symbolSize: 6,
})

export const getManualWaterLevelSeries = (id: string) => ({
  datasetId: id,
  type: 'scatter',
  name: 'Manual Depth to Water BGS (ft)',
  encode: { x: 'date', y: 'depth' },
  itemStyle: { color: '#1976d2' }, // blue
  showSymbol: true,
  symbolSize: 6,
})

export const getUserPointSeries = (id: string) => ({
  datasetId: id,
  type: 'scatter',
  name: 'Your Entry BGS (ft)',
  encode: { x: 'date', y: 'depth' },
  itemStyle: { color: '#fbc02d' }, // yellow
  symbolSize: 10,
  showSymbol: true,
})

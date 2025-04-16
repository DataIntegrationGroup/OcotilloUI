import ReactECharts from "echarts-for-react";
import React from "react";
import type { IHydrographOptions } from "@/interfaces/st2";

export const EditableHydrograph: React.FC<{
  chartRef: any;
  chartData: any;
  refresh?: number;
  options?: IHydrographOptions;
  onEvents?: any;
}> = ({ chartRef, chartData, refresh, options, onEvents }) => {
  let yaxisTitle = "Depth To Water Below Ground Surface (ft)";

  if (options?.useNormalization) {
    yaxisTitle = "Normalized Depth To Water Below Ground Surface (ft)";
  } else if (options?.useElevation) {
    yaxisTitle = "Groundwater Elevation Above Sea Level (ft)";
  } else if (options?.useCompact) {
    yaxisTitle = "Compact Depth To Water Below Ground Surface (ft)";
  }

  let dataZoomStart = -1;
  let dataZoomEnd = 100;
  if (options?.dataZoom == "latest") {
    dataZoomStart = 80;
    dataZoomEnd = 100;
  } else if (options?.dataZoom == "earliest") {
    dataZoomStart = 0;
    dataZoomEnd = 20;
  }

  const baseoption = {
    animation: false,
    dataset: chartData.dataset,
    series: chartData.series,
    toolbox: {
      feature: {
        dataZoom: [
          { show: true, title: { zoom: "Zoom In", back: "Zoom Out" } },
          { type: "inside", title: { zoom: "Zoom In", back: "Zoom Out" } },
        ],
        restore: {},
        saveAsImage: {},
        dataView: { show: true },
        brush: {
          type: ["lineX", "polygon", "clear"],
        },
      },
    },
    legend: {
      orient: "vertical",
      left: "82%",
      top: "20%",
      data: chartData.seriesNames,
    },
    grid: {
      right: "20%", // Adjust the right property to create space for the legend
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        animation: false,
        label: {
          backgroundColor: "#505765",
        },
      },
    },
    dataZoom: [
      {
        show: true,
        realtime: true,
        start: dataZoomStart,
        end: dataZoomEnd,
      },
      {
        type: "inside",
        realtime: true,
        start: dataZoomStart,
        end: dataZoomEnd,
      },
    ],
    xAxis: {
      type: "time",
      splitLine: {
        show: true, // This will display vertical grid lines
      },
    },
    yAxis: {
      inverse: true,
      name: yaxisTitle,
      nameLocation: "center",
      nameGap: 75,
      scale: true,
    },
    brush: {
      outOfBrush: {
        colorAlpha: 0.25,
      },
    },
  };

  const echarts_options = { ...baseoption };

  return (
    <div
      style={{
        height: "400px",
        paddingBottom: 20,
      }}
    >
      <ReactECharts
        ref={chartRef}
        key={refresh}
        option={echarts_options}
        style={{ width: "100%", height: "100%" }}
        onEvents={onEvents}
      />
    </div>
  );
};

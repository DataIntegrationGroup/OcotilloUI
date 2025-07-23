import { Button, CircularProgress, TextField, Box, Typography, Card, CardContent, CardHeader } from "@mui/material";
import { useAll } from "@/useAll";
import { useEffect, useRef, useState } from "react";
import { transform } from "@/components/Hydrographs/util";
import { ArrowDown, ArrowUp } from "react-flaticons";
import { WIPAlert, EditableHydrograph } from "@/components";
import * as d3 from "d3-polygon";

const transformer = (v: number, _ov: number, modifier: number) => v + modifier;

export const HydrographCorrector = () => {
  const chartRef = useRef(null);

  // hardcoded stuff. in future will be combination of user defined and retrieved data
  const activeDatastreamId = 26188;
  const pointid = "SO-0167";

  const [dtwOffset, setDTWOffset] = useState<number>(0);
  const [chartData, setChartData] = useState({
    series: [],
    dataset: [],
    seriesNames: [],
  });
  const [brushSelection, setBrushSelection] = useState<{
    globalMin?: number;
    globalMax?: number;
    dataPoints?: [];
    range?: [];
  } | null>(null);

  const [baseChartDatasource, setBaseChartDatasource] = useState({
    continuous: [],
    manual: [],
  });
  const [applyCorrection, setApplyCorrection] = useState(0);
  const [bumpUp, setBumpUp] = useState(0);
  const [bumpDown, setBumpDown] = useState(0);
  const [bumpOffset, setBumpOffset] = useState<number>(1);
  const [applyMatchToManual, setApplyMatchToManual] = useState(0);
  const [clearCorrection, setClearCorrection] = useState(0);

  const { isLoading, triggerAll } = useAll({
    resource: `Datastreams(${activeDatastreamId})/Observations`,
    maxItemCount: 100,
    pageSize: 1000,
    meta: {
      orderby: "resultTime asc",
    },
    dataProviderName: "st2",
  });

  const { isLoading: isLoadingAMP, triggerAll: triggerAMP } = useAll({
    resource: `waterlevels/manual`,
    meta: {
      params: {
        pointid: pointid,
      },
    },
    dataProviderName: "amp",
  });

  const make_series = (
    data: any,
    xtag: string,
    ytag: string,
    id: string,
    _index: number = 0,
  ) => {
    if (data.length === 0) {
      return { id: id, source: [] };
    }

    let ref = data[0][ytag];

    let obj = { id: id };
    let offset = 0;

    obj["source"] = data.map((obs: any) => [
      new Date(obs[xtag]),
      transform(obs[ytag], ref, offset, undefined).toFixed(2),
    ]);
    return obj;
  };

  useEffect(() => {
    if (brushSelection && chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      console.log("Dispatching brush action:", brushSelection);
      let brushType = "lineX";
      let range: number[];
      if (brushSelection.dataPoints) {
        brushType = "polygon";
        range = brushSelection.dataPoints;
      } else {
        range = [brushSelection.globalMin, brushSelection.globalMax];
      }

      console.log("Dispatching brush action:", range);
      instance.dispatchAction({
        type: "brush",
        areas: [
          {
            brushType: brushType,
            range: brushSelection.range,
            xAxisIndex: 0,
          },
        ],
      });
    }
  }, [chartData, brushSelection]);

  useEffect(() => {
    triggerAll().then((data) => {
      const continuous_data = data.map((d) => {
        return {
          phenomenonTime: d.phenomenonTime,
          result: parseFloat(d.result),
        };
      });

      triggerAMP().then((data2) => {
        const manual_data = data2.map((d) => {
          return {
            phenomenonTime: d.DateMeasured,
            result: d.DepthToWaterBGS,
          };
        });

        setBaseChartDatasource({
          continuous: continuous_data,
          manual: manual_data,
        });

        const continuous_series = {
          type: "line",
          symbol: "circle",
          name: "Continuous",
          datasetId: "continuous",
          clip: false,
        };

        const manual_series = {
          type: "scatter",
          symbol: "circle",
          name: "Manual",
          datasetId: "manual",
          clip: false,
        };
        const continuous_modified_series = {
          type: "line",
          symbol: "circle",
          name: "Continuous Modified",
          datasetId: "continuous_modified",
          clip: false,
        };
        const series = [
          continuous_series,
          continuous_modified_series,
          manual_series,
        ];
        const dataset = [
          make_series(
            continuous_data,
            "phenomenonTime",
            "result",
            "continuous",
          ),
          make_series(
            continuous_data,
            "phenomenonTime",
            "result",
            "continuous_modified_series",
          ),
        ];
        const seriesNames = ["Continuous", "Continuous Modified", "Manual"];
        setChartData({
          series: series,
          dataset: dataset,
          seriesNames: seriesNames,
        });
      });
    });
  }, [activeDatastreamId]);

  const modifyData = (modifier: number, transformer?: any) => {
    if (chartRef.current && brushSelection) {
      let continuous_modified_source: any;
      const instance = chartRef.current.getEchartsInstance();
      if (brushSelection.dataPoints) {
        continuous_modified_source = chartData.dataset[1].source.map(
          (d: any, index: number) => {
            const tindex = d[0].getTime();
            const ov = baseChartDatasource["continuous"][index].result;
            if (
              brushSelection.dataPoints.find(
                (dp: any) => dp[0].getTime() === tindex,
              )
            ) {
              if (transformer === undefined) {
                d[1] = ov + modifier;
              } else {
                d[1] = transformer(parseFloat(d[1]), ov, modifier);
              }
            }
            return d;
          },
        );
      } else {
        const minDataCoord = instance.convertFromPixel("grid", [
          brushSelection.globalMin,
          0,
        ])[0];
        const maxDataCoord = instance.convertFromPixel("grid", [
          brushSelection.globalMax,
          0,
        ])[0];

        continuous_modified_source = chartData.dataset[1].source.map(
          (d: any, index: number) => {
            const tindex = d[0].getTime();
            if (tindex >= minDataCoord && tindex <= maxDataCoord) {
              const ov = baseChartDatasource["continuous"][index].result;
              if (transformer === undefined) {
                d[1] = ov + modifier;
              } else {
                d[1] = transformer(parseFloat(d[1]), ov, modifier);
              }
            }
            return d;
          },
        );
      }

      const dataset = chartData.dataset;
      dataset[1] = {
        id: "continuous_modified",
        source: continuous_modified_source,
      };
      setChartData({ ...chartData, dataset: dataset });
    }
  };

  const clearData = () => { };

  useEffect(() => {
    clearData();
  }, [clearCorrection]);

  useEffect(() => {
    modifyData(dtwOffset);
  }, [applyCorrection]);

  useEffect(() => {
    console.log("useEffect for bumpUp fired");
    modifyData(-bumpOffset, transformer);
  }, [bumpUp]);

  useEffect(() => {
    console.log("useEffect for bumpDown fired");
    modifyData(bumpOffset, transformer);
  }, [bumpDown]);

  const onBrushEnd = (params: any) => {
    if (params.areas.length === 0) {
      setBrushSelection(null);
    } else {
      const area = params.areas[0];
      if (area.brushType === "polygon") {
        const polygon = area.range;
        const instance = chartRef.current.getEchartsInstance();
        const dataPoints = chartData.dataset[0].source.filter((point: any) => {
          const [x, y] = instance.convertToPixel("grid", point);
          return d3.polygonContains(polygon, [x, y]);
        });
        setBrushSelection({ dataPoints: dataPoints, range: polygon });
      } else {
        const [mi, ma] = area.range;
        setBrushSelection({ globalMin: mi, globalMax: ma, range: area.range });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <WIPAlert />
      <Card>
        <CardHeader title="Hydrograph Corrector" />
        <CardContent>
          <Box sx={{ padding: 1 }}>
            <TextField
              label="DTW Offset"
              type="number"
              value={dtwOffset}
              onChange={(e) => setDTWOffset(parseFloat(e.target.value))}
            />

            <Button
              onClick={() => setApplyCorrection(applyCorrection + 1)}
              disabled={brushSelection === null}
              variant={"contained"}
            >
              Apply Correction
            </Button>
            <Button
              onClick={() => {
                setApplyMatchToManual(applyMatchToManual + 1);
              }}
              disabled={brushSelection === null}
              variant={"contained"}
            >
              Match To Manual
            </Button>
          </Box>
          <Box sx={{ padding: 1 }}>
            <TextField
              label="bumpOffset"
              type="number"
              value={bumpOffset}
              onChange={(e) => setBumpOffset(parseFloat(e.target.value))}
            />
            <Button
              onClick={() => setBumpUp(bumpUp + 1)}
              disabled={brushSelection === null}
              variant={"contained"}
              startIcon={<ArrowUp />}
            >
              Bump Up
            </Button>
            <Button
              onClick={() => setBumpDown(bumpDown + 1)}
              disabled={brushSelection === null}
              variant={"contained"}
              startIcon={<ArrowDown />}
            >
              Bump Down
            </Button>
          </Box>
          <Box>
            <Button
              onClick={() => setClearCorrection(clearCorrection + 1)}
              disabled={brushSelection === null}
              variant={"contained"}
            >
              Clear Correction
            </Button>
          </Box>
          <Box position="relative">
            <EditableHydrograph
              chartRef={chartRef}
              onEvents={{
                brushEnd: onBrushEnd,
              }}
              chartData={chartData}
            />
            {(isLoading || isLoadingAMP) && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                sx={{ transform: "translate(-50%, -50%)" }}
              >
                <CircularProgress />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

import { Science } from "@mui/icons-material";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CROSSTAB_ONLY_TABS,
  CHEMISTRY_PARAMETER_NAME_MAP,
  FIELD_PARAMETER_DEFINITIONS,
  FIELD_PARAMETER_ORDER,
  GENERAL_PARAMETERS,
  STANDARD_FILTER_OPTIONS,
  TAB_OPTIONS,
  TRACER_SYMBOLS,
  VIEW_OPTIONS,
  type ChemistryViewMode,
  type StandardFilter,
} from "@/constants";
import type {
  ChemistryDisplayCrosstabColumn,
  ChemistryDisplayCrosstabRow,
  ChemistryDisplayResponse,
  ChemistryDisplayResult,
  ChemistryDisplayStandardStatus,
  ChemistryDisplayTabKey,
  ChemistryResult,
} from "@/interfaces/ocotillo";
import { settings } from "@/settings";
import {
  collectionDateForInput,
  compareSamplesByCollectionDate,
  dateTime,
  formatChemistryDate,
  formatDateForEndpoint,
  formatDateForInput,
} from "@/utils/Date";
import { fetchAllOcotilloPages } from "@/utils/ocotilloPaging";

type ChemistryCardProps = {
  thingId?: number | string | null;
};

type CurrentResultRow = ChemistryDisplayResult;

type StandardResultRow = ChemistryDisplayResult;

type CrosstabGridRow = ChemistryDisplayCrosstabRow & {
  id: number;
};

const EMPTY_CROSSTAB_ROWS: CrosstabGridRow[] = [];
const EMPTY_RESULTS: ChemistryDisplayResult[] = [];

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const sampleDisplayLabel = (
  sample: ChemistryDisplayResponse["samples"][number],
) => sample.nma_sample_point_id?.trim() || sample.label;

const formatResultValue = (result?: ChemistryDisplayResult) => {
  if (!result) return "-";
  return formatValue(result.value);
};

const isNonDetectResult = (result?: ChemistryDisplayResult) => {
  if (!result) return false;

  return result.symbol?.trim() === "<";
};

const displayParameterName = (
  result: Pick<ChemistryDisplayResult, "parameter_name" | "analyte">,
) => {
  return result.parameter_name
    ? (CHEMISTRY_PARAMETER_NAME_MAP[result.parameter_name] ??
        result.parameter_name)
    : result.parameter_name;
};

const renderResultValue = (result?: ChemistryDisplayResult) => {
  if (!isNonDetectResult(result)) return formatResultValue(result);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Badge variant="outline">ND</Badge>
      <Typography variant="body2">&lt; {formatResultValue(result)}</Typography>
    </Box>
  );
};

const renderParameterHeader = (label: string, unit?: string | null) => (
  <Stack spacing={0} sx={{ lineHeight: 1.2 }}>
    <Typography variant="body2" fontWeight={600}>
      {label}
    </Typography>
    {unit ? (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "0.65rem" }}
      >
        {unit}
      </Typography>
    ) : null}
  </Stack>
);

const normalizeParameterName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_/-]+/g, " ")
    .replace(/\s+/g, " ");

const fieldParameterDefinition = (result: ChemistryDisplayResult) => {
  const candidates = [
    result.parameter_name,
    result.symbol,
    result.analyte,
    result.parameter_key,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeParameterName);

  return FIELD_PARAMETER_DEFINITIONS.find((parameter) =>
    parameter.aliases.some((alias) =>
      candidates.some(
        (candidate) => candidate === alias || candidate.endsWith(` ${alias}`),
      ),
    ),
  );
};

const canonicalFieldParameterRows = (
  rows: ChemistryDisplayResult[],
  sampleInfoId: number,
  includeMissing: boolean,
) => {
  const canonicalRows = rows.flatMap((row) => {
    const definition = fieldParameterDefinition(row);
    if (row.source === "field" && !definition) return [];
    return [definition ? { ...row, parameter_name: definition.label } : row];
  });

  if (includeMissing) {
    const presentLabels = new Set(
      canonicalRows.map((row) => row.parameter_name).filter(Boolean),
    );

    for (const parameter of FIELD_PARAMETER_DEFINITIONS) {
      if (!presentLabels.has(parameter.label)) {
        canonicalRows.push({
          id: `field-parameter-placeholder-${sampleInfoId}-${parameter.key}`,
          sample_info_id: sampleInfoId,
          source: "field",
          parameter_key: parameter.key,
          parameter_name: parameter.label,
          value: null,
        });
      }
    }
  }

  return canonicalRows.sort((a, b) => {
    const aName = a.parameter_name ?? a.analyte ?? a.parameter_key;
    const bName = b.parameter_name ?? b.analyte ?? b.parameter_key;
    const aOrder = FIELD_PARAMETER_ORDER.get(aName);
    const bOrder = FIELD_PARAMETER_ORDER.get(bName);

    if (aOrder !== undefined || bOrder !== undefined) {
      return (
        (aOrder ?? Number.POSITIVE_INFINITY) -
        (bOrder ?? Number.POSITIVE_INFINITY)
      );
    }

    return aName.localeCompare(bName, undefined, { sensitivity: "base" });
  });
};

const isNoDisplayDataError = (error: unknown) => {
  return axios.isAxiosError(error) && error.response?.status === 404;
};

const matchesStandardFilter = (
  result: ChemistryDisplayResult,
  filter: StandardFilter,
) => {
  if (filter === "all") return true;
  if (filter === "non_detects") return isNonDetectResult(result);

  const status = result.standard?.status;
  if (filter === "above_mcl") return status === "above_mcl";
  if (filter === "above_smcl") return status === "above_smcl";

  return status === "above_mcl" || status === "above_smcl";
};

const standardChipColor = (
  status?: ChemistryDisplayStandardStatus,
): "default" | "error" | "warning" | "success" => {
  if (status === "above_mcl") return "error";
  if (status === "above_smcl") return "warning";
  if (status === "not_compared") return "default";
  return "success";
};

const standardLabel = (result: ChemistryDisplayResult) => {
  return result.standard?.label ?? "Not compared";
};

const crosstabColumnsForResults = (
  results: ChemistryDisplayResult[],
): ChemistryDisplayCrosstabColumn[] => {
  const columnsByKey = new Map<string, ChemistryDisplayCrosstabColumn>();

  for (const result of results) {
    if (result.source === "field" && !fieldParameterDefinition(result)) {
      continue;
    }

    if (!columnsByKey.has(result.parameter_key)) {
      columnsByKey.set(result.parameter_key, {
        parameter_key: result.parameter_key,
        parameter_name: displayParameterName(result),
        symbol: result.symbol,
        unit: result.unit,
      });
    }
  }

  return [...columnsByKey.values()];
};

const displayResponseFromResults = (
  items: ChemistryResult[],
): ChemistryDisplayResponse => {
  const resultsByTab: Record<ChemistryDisplayTabKey, ChemistryDisplayResult[]> =
    {
      field_parameters: [],
      general_chemistry: [],
      environmental_tracers: [],
      additional_analyses: [],
    };
  const samplesById = new Map<number, ChemistryDisplayResponse["samples"][0]>();

  for (const item of items) {
    if (item.sample_id == null) continue;

    if (!samplesById.has(item.sample_id)) {
      samplesById.set(item.sample_id, {
        id: item.sample_id,
        thing_id: item.thing_id,
        label: `Sample ${item.sample_id}`,
        nma_sample_point_id: item.sample_point_id,
        collection_date: item.observation_datetime,
      });
    }

    const result: ChemistryDisplayResult = {
      ...item,
      sample_info_id: item.sample_id,
      parameter_name: displayParameterName(item),
    };
    const parameterName = (item.parameter_name ?? "").toLowerCase();
    const symbol = (item.symbol ?? item.analyte ?? "").trim().toLowerCase();
    const tab =
      item.source === "field"
        ? "field_parameters"
        : GENERAL_PARAMETERS.has(parameterName)
          ? "general_chemistry"
          : TRACER_SYMBOLS.has(symbol)
            ? "environmental_tracers"
            : "additional_analyses";
    resultsByTab[tab].push(result);
  }

  return {
    samples: [...samplesById.values()].sort(compareSamplesByCollectionDate),
    field_parameters: { results: resultsByTab.field_parameters },
    general_chemistry: { results: resultsByTab.general_chemistry },
    environmental_tracers: { results: resultsByTab.environmental_tracers },
    additional_analyses: { results: resultsByTab.additional_analyses },
  };
};

export const ChemistryCard = ({ thingId }: ChemistryCardProps) => {
  const [selectedSampleInfoId, setSelectedSampleInfoId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [standardFilter, setStandardFilter] = useState<StandardFilter>("all");
  const [viewMode, setViewMode] = useState<ChemistryViewMode>("current");
  const [activeTab, setActiveTab] =
    useState<ChemistryDisplayTabKey>("field_parameters");
  const dateBoundsRef = useRef({ thingId, oldestSampleDate: "" });

  if (dateBoundsRef.current.thingId !== thingId) {
    dateBoundsRef.current = { thingId, oldestSampleDate: "" };
  }

  const chemistryQuery = useQuery({
    queryKey: ["well-chemistry-display", thingId ?? "", startDate, endDate],
    enabled: Boolean(thingId),
    retry: (failureCount, error) =>
      !isNoDisplayDataError(error) && failureCount < 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const params: Record<string, string> = {
        thing_id: String(thingId),
        exclude_field_duplicate_samples: "true",
      };

      const startTime = formatDateForEndpoint(startDate);
      if (startTime) {
        params.start_time = startTime;
      }

      const endTime = formatDateForEndpoint(endDate, true);
      if (endTime) {
        params.end_time = endTime;
      }

      const items = await fetchAllOcotilloPages<ChemistryResult>(
        "chemistry/results",
        params,
        {
          pageSize: 1000,
          signal,
        },
      );

      return displayResponseFromResults(items);
    },
  });

  const chemistry = chemistryQuery.data;
  const noDisplayData =
    isNoDisplayDataError(chemistryQuery.error) ||
    chemistry?.samples.length === 0;
  const activeTabData = chemistry?.[activeTab];
  const isCrosstabOnlyTab = CROSSTAB_ONLY_TABS.has(activeTab);
  const effectiveViewMode: ChemistryViewMode = isCrosstabOnlyTab
    ? "crosstab"
    : viewMode;
  const isLoading = chemistryQuery.isLoading || chemistryQuery.isPending;
  const controlsDisabled = isLoading || noDisplayData || !chemistry;

  const samples = useMemo(
    () => [...(chemistry?.samples ?? [])].sort(compareSamplesByCollectionDate),
    [chemistry?.samples],
  );
  const oldestVisibleSampleDate = collectionDateForInput(
    samples[0]?.collection_date,
  );
  if (
    !startDate &&
    !endDate &&
    oldestVisibleSampleDate &&
    (!dateBoundsRef.current.oldestSampleDate ||
      oldestVisibleSampleDate < dateBoundsRef.current.oldestSampleDate)
  ) {
    dateBoundsRef.current.oldestSampleDate = oldestVisibleSampleDate;
  }
  const oldestSampleDate = dateBoundsRef.current.oldestSampleDate;
  const today = formatDateForInput(new Date());
  const startDateMaximum = endDate && endDate < today ? endDate : today;
  const endDateMinimum = startDate || oldestSampleDate;

  const handleStartDateChange = (value: string) => {
    if (
      value &&
      ((oldestSampleDate && value < oldestSampleDate) ||
        value > today ||
        (endDate && value > endDate))
    ) {
      return;
    }

    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    if (
      value &&
      ((endDateMinimum && value < endDateMinimum) || value > today)
    ) {
      return;
    }

    setEndDate(value);
  };
  const selectedSampleId = Number(
    selectedSampleInfoId || samples[samples.length - 1]?.id,
  );
  const selectedSample =
    samples.find((sample) => sample.id === selectedSampleId) ?? samples[0];
  const selectedSampleNote = selectedSample?.sample_notes ?? null;
  const showSelectedSampleNote =
    activeTab === "field_parameters" &&
    effectiveViewMode === "current" &&
    Boolean(selectedSampleNote);

  const filteredCurrentRows = useMemo(() => {
    const rows = selectedSample?.id
      ? (activeTabData?.results ?? EMPTY_RESULTS).filter(
          (row) => row.sample_info_id === selectedSample.id,
        )
      : (activeTabData?.results ?? EMPTY_RESULTS);

    const filteredRows = rows.filter((row) =>
      matchesStandardFilter(row, standardFilter),
    );

    if (activeTab !== "field_parameters") return filteredRows;

    return canonicalFieldParameterRows(
      filteredRows,
      selectedSample?.id ?? 0,
      standardFilter === "all",
    );
  }, [activeTab, activeTabData, selectedSample?.id, standardFilter]);

  const standardsSummary = useMemo(() => {
    if (activeTab !== "general_chemistry") {
      return null;
    }

    const rows = filteredCurrentRows;
    const standards = rows.flatMap((row) =>
      row.standard ? [row.standard] : [],
    );
    const comparedParameterCount = standards.filter(
      (standard) =>
        standard.status !== "no_limit" && standard.status !== "not_compared",
    ).length;
    const latestAnalysisDate = rows
      .map((row) => row.analysis_date)
      .filter(Boolean)
      .sort((a, b) => dateTime(b) - dateTime(a))[0];

    return {
      above_mcl_count: standards.filter(
        (standard) => standard.status === "above_mcl",
      ).length,
      above_smcl_count: standards.filter(
        (standard) => standard.status === "above_smcl",
      ).length,
      compared_parameter_count: comparedParameterCount,
      latest_analysis_date: latestAnalysisDate,
    };
  }, [activeTab, filteredCurrentRows]);

  const filteredCrosstabColumns = useMemo(() => {
    const allResults = activeTabData?.results ?? EMPTY_RESULTS;
    const columns = crosstabColumnsForResults(allResults);

    return columns.filter((column) =>
      allResults
        .filter((result) => result.parameter_key === column.parameter_key)
        .some((result) => matchesStandardFilter(result, standardFilter)),
    );
  }, [activeTabData, standardFilter]);

  const crosstabRows = useMemo<CrosstabGridRow[]>(() => {
    if (!activeTabData || samples.length === 0) return EMPTY_CROSSTAB_ROWS;

    return samples.map((sample) => {
      const values: Record<string, ChemistryDisplayResult> = {};

      for (const result of activeTabData.results) {
        if (
          result.sample_info_id === sample.id &&
          matchesStandardFilter(result, standardFilter)
        ) {
          values[result.parameter_key] = result;
        }
      }

      return {
        id: sample.id,
        sample_info_id: sample.id,
        sample_label: sampleDisplayLabel(sample),
        collection_date: sample.collection_date,
        values,
        sample_notes: sample.sample_notes,
      };
    });
  }, [activeTabData, samples, standardFilter]);

  const currentColumns = useMemo<GridColDef<CurrentResultRow>[]>(
    () => [
      {
        field: "parameter_name",
        headerName: "Parameter",
        minWidth: 190,
        flex: 1,
        align: "left",
        headerAlign: "left",
        valueGetter: (_value, row) => displayParameterName(row) ?? "-",
      },
      {
        field: "value",
        headerName: "Value",
        type: "number",
        minWidth: 110,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => renderResultValue(params.row),
      },
      {
        field: "unit",
        headerName: "Unit",
        minWidth: 90,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "stabilized",
        headerName: "Stabilized",
        minWidth: 120,
        align: "left",
        headerAlign: "left",
        valueFormatter: (value) => (value == null ? "-" : value ? "Yes" : "No"),
      },
      {
        field: "notes",
        headerName: "Notes",
        minWidth: 220,
        flex: 1,
        align: "left",
        headerAlign: "left",
      },
    ],
    [],
  );

  const standardsColumns = useMemo<GridColDef<StandardResultRow>[]>(
    () => [
      {
        field: "parameter_name",
        headerName: "Parameter",
        minWidth: 190,
        flex: 1,
        valueGetter: (_value, row) => displayParameterName(row) ?? "-",
      },
      {
        field: "value",
        headerName: "Result",
        type: "number",
        minWidth: 110,
        renderCell: (params) => renderResultValue(params.row),
      },
      {
        field: "unit",
        headerName: "Unit",
        minWidth: 90,
      },
      {
        field: "primary_mcl",
        headerName: "EPA primary MCL",
        minWidth: 150,
        valueGetter: (_value, row) => row.standard?.primary_mcl ?? null,
        valueFormatter: (value) => formatValue(value),
      },
      {
        field: "secondary_smcl",
        headerName: "EPA secondary SMCL",
        minWidth: 170,
        valueGetter: (_value, row) => row.standard?.secondary_smcl ?? null,
        valueFormatter: (value) => formatValue(value),
      },
      {
        field: "status_label",
        headerName: "Status",
        minWidth: 150,
        renderCell: (params) => (
          <Chip
            size="small"
            label={standardLabel(params.row)}
            color={standardChipColor(params.row.standard?.status)}
            variant={
              params.row.standard?.status === "not_compared"
                ? "outlined"
                : "filled"
            }
          />
        ),
      },
      {
        field: "basis",
        headerName: "Basis",
        minWidth: 220,
        flex: 1,
        valueGetter: (_value, row) => row.standard?.basis ?? "",
      },
    ],
    [],
  );

  const crosstabColumns = useMemo<GridColDef<CrosstabGridRow>[]>(() => {
    const restrictAnalysisColumns = activeTab !== "field_parameters";
    const orderedCrosstabColumns =
      activeTab === "field_parameters"
        ? [
            ...FIELD_PARAMETER_DEFINITIONS.map((parameter) => {
              const matchingResult = activeTabData?.results.find(
                (result) => fieldParameterDefinition(result) === parameter,
              );

              return {
                parameter_key: parameter.key,
                parameter_name: parameter.label,
                unit: matchingResult?.unit,
              };
            }),
            ...filteredCrosstabColumns
              .filter((column) => {
                const matchingResult = activeTabData?.results.find(
                  (result) => result.parameter_key === column.parameter_key,
                );
                return (
                  !matchingResult || !fieldParameterDefinition(matchingResult)
                );
              })
              .sort((a, b) =>
                (a.parameter_name ?? a.symbol ?? a.parameter_key).localeCompare(
                  b.parameter_name ?? b.symbol ?? b.parameter_key,
                  undefined,
                  { sensitivity: "base" },
                ),
              ),
          ]
        : [...filteredCrosstabColumns].sort((a, b) =>
            (a.parameter_name ?? a.symbol ?? a.parameter_key).localeCompare(
              b.parameter_name ?? b.symbol ?? b.parameter_key,
              undefined,
              { sensitivity: "base" },
            ),
          );
    const parameterColumns: GridColDef<CrosstabGridRow>[] =
      orderedCrosstabColumns.map((column) => ({
        field: `parameter_${column.parameter_key}`,
        headerName:
          column.parameter_name ?? column.symbol ?? column.parameter_key,
        renderHeader: () =>
          renderParameterHeader(
            column.parameter_name ?? column.symbol ?? column.parameter_key,
            column.unit,
          ),
        minWidth: 150,
        sortable: restrictAnalysisColumns ? false : undefined,
        filterable: restrictAnalysisColumns ? false : undefined,
        renderCell: (params) => {
          const result =
            activeTab === "field_parameters"
              ? (Object.values(params.row.values).find(
                  (value) =>
                    fieldParameterDefinition(value)?.label ===
                    column.parameter_name,
                ) ?? params.row.values[column.parameter_key])
              : params.row.values[column.parameter_key];
          return <Box>{renderResultValue(result)}</Box>;
        },
      }));

    return [
      { field: "sample_label", headerName: "Sample", minWidth: 170 },
      {
        field: "collection_date",
        headerName: "Sample Collection Date",
        minWidth: 170,
        valueFormatter: (value) => formatChemistryDate(value),
      },
      ...parameterColumns,
      {
        field: "sample_notes",
        headerName: "Sampling Event Note",
        minWidth: 240,
        flex: 1,
        sortable: restrictAnalysisColumns ? false : undefined,
        filterable: restrictAnalysisColumns ? false : undefined,
      },
    ];
  }, [activeTab, activeTabData, filteredCrosstabColumns]);

  if (!thingId) {
    return null;
  }

  const resetFilters = () => {
    setSelectedSampleInfoId("");
    setStartDate("");
    setEndDate("");
    setStandardFilter("all");
    setViewMode("current");
    setActiveTab("field_parameters");
  };

  const showStandardsTable =
    activeTab === "general_chemistry" && effectiveViewMode === "current";
  const currentGridColumns = showStandardsTable
    ? standardsColumns
    : currentColumns;

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Science color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Chemistry
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1.5, pb: 3 }}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="grid gap-1.5 md:min-w-[220px]">
            <Label htmlFor="water-chemistry-sample">Sample</Label>
            <Select
              value={String(selectedSample?.id ?? "")}
              onValueChange={setSelectedSampleInfoId}
              disabled={controlsDisabled || effectiveViewMode === "crosstab"}
            >
              <SelectTrigger id="water-chemistry-sample" className="w-full">
                <SelectValue placeholder="Select a sample" />
              </SelectTrigger>
              <SelectContent position="popper">
                {samples.map((sample) => (
                  <SelectItem key={sample.id} value={String(sample.id)}>
                    {sampleDisplayLabel(sample)} -{" "}
                    {formatChemistryDate(sample.collection_date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="water-chemistry-from">From</Label>
            <Input
              id="water-chemistry-from"
              type="date"
              value={startDate}
              min={oldestSampleDate || undefined}
              max={startDateMaximum}
              onChange={(event) => handleStartDateChange(event.target.value)}
              disabled={controlsDisabled}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="water-chemistry-to">To</Label>
            <Input
              id="water-chemistry-to"
              type="date"
              value={endDate}
              min={endDateMinimum || undefined}
              max={today}
              onChange={(event) => handleEndDateChange(event.target.value)}
              disabled={controlsDisabled}
            />
          </div>
          <div className="grid gap-1.5 md:min-w-[170px]">
            <Label htmlFor="water-chemistry-show">Show</Label>
            <Select
              value={standardFilter}
              onValueChange={(value) =>
                setStandardFilter(value as StandardFilter)
              }
              disabled={controlsDisabled}
            >
              <SelectTrigger id="water-chemistry-show" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {STANDARD_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 md:min-w-[180px]">
            <Label htmlFor="water-chemistry-view">View</Label>
            <Select
              value={effectiveViewMode}
              onValueChange={(value) => setViewMode(value as ChemistryViewMode)}
              disabled={controlsDisabled || isCrosstabOnlyTab}
            >
              <SelectTrigger id="water-chemistry-view" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {VIEW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="default" onClick={resetFilters}>
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
        </div>

        {noDisplayData ? (
          <Typography color="text.secondary" sx={{ py: 2 }} textAlign="center">
            No chemistry data exists for this well.
          </Typography>
        ) : (
          <>
            {showSelectedSampleNote ? (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  bgcolor: "action.hover",
                  borderLeft: "3px solid",
                  borderColor: "primary.main",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">
                  <strong>Sampling Event Note:</strong> {selectedSampleNote}
                </Typography>
              </Box>
            ) : null}

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as ChemistryDisplayTabKey)
              }
              className="mb-4 block overflow-x-auto border-b"
            >
              <TabsList className="w-max rounded-b-none bg-transparent p-0">
                {TAB_OPTIONS.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    disabled={controlsDisabled}
                    className="rounded-b-none border-0 border-b-2 border-transparent px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {showStandardsTable && standardsSummary ? (
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Chip
                  color="error"
                  label={`${standardsSummary.above_mcl_count} MCL`}
                />
                <Chip
                  color="warning"
                  label={`${standardsSummary.above_smcl_count} SMCL`}
                />
                <Chip
                  variant="outlined"
                  label={`${standardsSummary.compared_parameter_count} compared`}
                />
                <Chip
                  variant="outlined"
                  label={`Latest analysis ${formatChemistryDate(
                    standardsSummary.latest_analysis_date,
                  )}`}
                />
              </Stack>
            ) : null}

            {effectiveViewMode === "crosstab" ? (
              <DataGrid
                rowSelection={false}
                columnHeaderHeight={52}
                rowHeight={settings.rowHeight}
                rows={crosstabRows}
                columns={crosstabColumns}
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25, page: 0 },
                  },
                }}
                loading={isLoading}
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #f0f0f0",
                  },
                }}
              />
            ) : (
              <DataGrid
                rowSelection={false}
                rowHeight={settings.rowHeight}
                rows={filteredCurrentRows}
                columns={currentGridColumns}
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25, page: 0 },
                  },
                }}
                loading={isLoading}
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #f0f0f0",
                  },
                }}
              />
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};

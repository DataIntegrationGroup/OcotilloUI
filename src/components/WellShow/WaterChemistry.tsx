import {
  DownloadOutlined,
  RestartAltOutlined,
  Science,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import type {
  ChemistryDisplayCrosstabColumn,
  ChemistryDisplayCrosstabRow,
  ChemistryDisplayResponse,
  ChemistryDisplayResult,
  ChemistryDisplayStandardStatus,
  ChemistryDisplayTabKey,
  WaterChemistryResult,
  WaterChemistryResultsPage,
} from "@/interfaces/ocotillo";
import { axiosCall } from "@/providers/ocotillo-data-provider";
import { settings } from "@/settings";

type WaterChemistryCardProps = {
  thingId?: number | string | null;
};

type StandardFilter =
  | "all"
  | "above_mcl"
  | "above_smcl"
  | "any_epa_flag"
  | "non_detects";

type ChemistryViewMode = "current" | "crosstab";

type CurrentResultRow = ChemistryDisplayResult;

type StandardResultRow = ChemistryDisplayResult;

type CrosstabGridRow = ChemistryDisplayCrosstabRow & {
  id: number;
};

const TAB_OPTIONS: {
  key: ChemistryDisplayTabKey;
  label: string;
}[] = [
  { key: "field_parameters", label: "Field Parameters" },
  { key: "general_chemistry", label: "General Chemistry" },
  { key: "environmental_tracers", label: "Environmental Tracers" },
  { key: "additional_analyses", label: "Additional Analyses" },
];

const STANDARD_FILTER_OPTIONS: { value: StandardFilter; label: string }[] = [
  { value: "all", label: "All parameters" },
  { value: "above_mcl", label: "Above MCL only" },
  { value: "above_smcl", label: "Above SMCL only" },
  { value: "any_epa_flag", label: "Any EPA flag" },
  { value: "non_detects", label: "Non-detects only" },
];

const VIEW_OPTIONS: { value: ChemistryViewMode; label: string }[] = [
  { value: "current", label: "Current tab" },
  { value: "crosstab", label: "Cross-tab for all views" },
];

const CROSSTAB_ONLY_TABS = new Set<ChemistryDisplayTabKey>([
  "general_chemistry",
  "environmental_tracers",
  "additional_analyses",
]);

const EMPTY_CROSSTAB_ROWS: CrosstabGridRow[] = [];
const EMPTY_RESULTS: ChemistryDisplayResult[] = [];
const GENERAL_PARAMETERS = new Set([
  "arsenic",
  "bicarbonate",
  "calcium",
  "chloride",
  "fluoride",
  "ion balance",
  "iron",
  "magnesium",
  "manganese",
  "nitrate (as n)",
  "potassium",
  "sodium",
  "sulfate",
  "total dissolved solids",
  "ph",
  "uranium (total, by icp-ms)",
  "uranium, total, unfiltered",
]);

const TRACER_SYMBOLS = new Set([
  "3h",
  "h2r",
  "o18r",
  "o17r",
  "c13r",
  "c14",
  "c14_years",
  "sf6",
  "cfc11",
  "cfc12",
  "cfc113",
  "cfc113_12",
  "sr87:sr86",
  "d18o-so4",
  "d34s-so4",
]);

const formatDate = (value: unknown) => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatDateForEndpoint = (value: string, endOfRange = false) => {
  if (!value) return undefined;

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;

  if (endOfRange) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date.toISOString();
};

const dateTime = (value: unknown) => {
  if (!value) return 0;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const formatResultValue = (result?: ChemistryDisplayResult) => {
  if (!result) return "-";
  const value = formatValue(result.value);
  const unit = result.unit ? ` ${result.unit}` : "";
  return `${value}${unit}`;
};

const isNoDisplayDataError = (error: unknown) => {
  return axios.isAxiosError(error) && error.response?.status === 404;
};

const matchesStandardFilter = (
  result: ChemistryDisplayResult,
  filter: StandardFilter,
) => {
  if (filter === "all") return true;
  if (filter === "non_detects") return result.value == null;

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
    if (!columnsByKey.has(result.parameter_key)) {
      columnsByKey.set(result.parameter_key, {
        parameter_key: result.parameter_key,
        parameter_name: result.parameter_name,
        symbol: result.symbol,
        unit: result.unit,
      });
    }
  }

  return [...columnsByKey.values()];
};

const displayResponseFromResults = (
  items: WaterChemistryResult[],
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
        collection_date: item.observation_datetime,
      });
    }

    const result: ChemistryDisplayResult = {
      ...item,
      sample_info_id: item.sample_id,
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
    samples: [...samplesById.values()].sort(
      (a, b) => dateTime(b.collection_date) - dateTime(a.collection_date),
    ),
    field_parameters: { results: resultsByTab.field_parameters },
    general_chemistry: { results: resultsByTab.general_chemistry },
    environmental_tracers: { results: resultsByTab.environmental_tracers },
    additional_analyses: { results: resultsByTab.additional_analyses },
  };
};

export const WaterChemistryCard = ({ thingId }: WaterChemistryCardProps) => {
  const [selectedSampleInfoId, setSelectedSampleInfoId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [standardFilter, setStandardFilter] = useState<StandardFilter>("all");
  const [viewMode, setViewMode] = useState<ChemistryViewMode>("current");
  const [activeTab, setActiveTab] =
    useState<ChemistryDisplayTabKey>("field_parameters");

  const chemistryQuery = useQuery({
    queryKey: ["well-chemistry-display", thingId ?? "", startDate, endDate],
    enabled: Boolean(thingId),
    retry: (failureCount, error) =>
      !isNoDisplayDataError(error) && failureCount < 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      params.set("thing_id", String(thingId));
      params.set("size", "10000");

      const startTime = formatDateForEndpoint(startDate);
      if (startTime) {
        params.set("start_time", startTime);
      }

      const endTime = formatDateForEndpoint(endDate, true);
      if (endTime) {
        params.set("end_time", endTime);
      }

      const response = await axiosCall(`chemistry/results?${params}`, {
        method: "GET",
        signal,
        headers: { "Content-Type": "application/json" },
      });

      const page = response.data as WaterChemistryResultsPage;
      return displayResponseFromResults(page.items);
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

  const samples = chemistry?.samples ?? [];
  const selectedSampleId = Number(selectedSampleInfoId || samples[0]?.id);
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

    return rows.filter((row) => matchesStandardFilter(row, standardFilter));
  }, [activeTabData, selectedSample?.id, standardFilter]);

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
        sample_label: sample.label,
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
        valueGetter: (_value, row) => row.parameter_name ?? row.analyte ?? "-",
      },
      {
        field: "value",
        headerName: "Value",
        type: "number",
        minWidth: 110,
      },
      { field: "unit", headerName: "Unit", minWidth: 90 },
      {
        field: "standard",
        headerName: "EPA Status",
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
      { field: "analysis_method", headerName: "Method", minWidth: 150 },
      {
        field: "analysis_date",
        headerName: "Analysis Date",
        minWidth: 140,
        valueFormatter: (value) => formatDate(value),
      },
      { field: "analyses_agency", headerName: "Agency", minWidth: 160 },
      { field: "notes", headerName: "Notes", minWidth: 220, flex: 1 },
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
        valueGetter: (_value, row) => row.parameter_name ?? row.analyte ?? "-",
      },
      { field: "value", headerName: "Result", type: "number", minWidth: 110 },
      { field: "unit", headerName: "Unit", minWidth: 90 },
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
    const parameterColumns: GridColDef<CrosstabGridRow>[] =
      filteredCrosstabColumns.map((column) => ({
        field: `parameter_${column.parameter_key}`,
        headerName: `${column.parameter_name ?? column.symbol ?? column.parameter_key}${
          column.unit ? ` (${column.unit})` : ""
        }`,
        minWidth: 150,
        renderCell: (params) => {
          const result = params.row.values[column.parameter_key];
          return (
            <Box>
              <Typography variant="body2">
                {formatResultValue(result)}
              </Typography>
              {result?.notes ? (
                <Typography variant="caption" color="text.secondary">
                  {result.notes}
                </Typography>
              ) : null}
            </Box>
          );
        },
      }));

    return [
      { field: "sample_label", headerName: "Sample", minWidth: 170 },
      {
        field: "collection_date",
        headerName: "Sample Collection Date",
        minWidth: 170,
        valueFormatter: (value) => formatDate(value),
      },
      ...parameterColumns,
      {
        field: "sample_notes",
        headerName: "Sampling Event Note",
        minWidth: 240,
        flex: 1,
      },
    ];
  }, [filteredCrosstabColumns]);

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
          Water Chemistry
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1.5, pb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <FormControl
            size="small"
            disabled={controlsDisabled}
            sx={{ minWidth: { md: 220 } }}
          >
            <InputLabel id="water-chemistry-sample-label">Sample</InputLabel>
            <Select
              labelId="water-chemistry-sample-label"
              label="Sample"
              value={selectedSampleInfoId}
              onChange={(event) => setSelectedSampleInfoId(event.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                {selectedSample
                  ? `${selectedSample.label} - ${formatDate(
                      selectedSample.collection_date,
                    )}`
                  : "Newest sample"}
              </MenuItem>
              {samples.map((sample) => (
                <MenuItem key={sample.id} value={String(sample.id)}>
                  {sample.label} - {formatDate(sample.collection_date)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="From"
            type="date"
            size="small"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            disabled={controlsDisabled}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            disabled={controlsDisabled}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl
            size="small"
            disabled={controlsDisabled}
            sx={{ minWidth: { md: 170 } }}
          >
            <InputLabel id="water-chemistry-show-label">Show</InputLabel>
            <Select
              labelId="water-chemistry-show-label"
              label="Show"
              value={standardFilter}
              onChange={(event) =>
                setStandardFilter(event.target.value as StandardFilter)
              }
            >
              {STANDARD_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            size="small"
            disabled={controlsDisabled || isCrosstabOnlyTab}
            sx={{ minWidth: { md: 180 } }}
          >
            <InputLabel id="water-chemistry-view-label">View</InputLabel>
            <Select
              labelId="water-chemistry-view-label"
              label="View"
              value={effectiveViewMode}
              onChange={(event) =>
                setViewMode(event.target.value as ChemistryViewMode)
              }
            >
              {VIEW_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltOutlined />}
            onClick={resetFilters}
            disabled={controlsDisabled}
          >
            Reset
          </Button>
        </Stack>

        {noDisplayData ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No chemistry data exists for this well.
          </Typography>
        ) : null}

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
          onChange={(_event, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          {TAB_OPTIONS.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              label={tab.label}
              disabled={controlsDisabled}
            />
          ))}
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
              label={`Latest analysis ${formatDate(
                standardsSummary.latest_analysis_date,
              )}`}
            />
          </Stack>
        ) : null}

        {effectiveViewMode === "crosstab" ? (
          <DataGrid
            rowHeight={settings.rowHeight}
            rows={crosstabRows}
            columns={crosstabColumns}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
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
            rowHeight={settings.rowHeight}
            rows={filteredCurrentRows}
            columns={currentGridColumns}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
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
      </Box>
    </Paper>
  );
};

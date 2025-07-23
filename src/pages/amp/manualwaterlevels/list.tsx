import { useMemo } from "react";
import { ShowButton, EditButton, List, useDataGrid } from "@refinedev/mui";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { IManualWaterLevel } from "@/interfaces/amp";
import { publicReleaseChip } from "@/components/util";
import { settings } from "@/settings";
import { WIPAlert } from "@/components";
import { Box } from "@mui/material";

export const ManualWaterLevelList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IManualWaterLevel>();
  const columns = useMemo<GridColDef<IManualWaterLevel>[]>(
    () => [
      {
        field: "OBJECTID",
        headerName: "ID",
        type: "string",
        minWidth: 50,
      },
      { field: 'PointID', headerName: 'Point ID', minWidth: 50 },
      { field: 'DateMeasured', headerName: 'Measurement Date', minWidth: 150 },
      { field: 'DepthToWaterBGS', headerName: 'Depth to Water BGS (ft)', minWidth: 165 },
      {
        field: 'PublicRelease', headerName: 'Public Release',
        renderCell: publicReleaseChip, minWidth: 120
      },
      { field: 'MeasuringAgency', headerName: 'Measuring Agency', minWidth: 150 },
      { field: 'LevelStatus', headerName: 'Status', minWidth: 50 },
      { field: 'DataQuality', headerName: 'Data Quality', minWidth: 50 },
      { field: 'DataSource', headerName: 'Data Source', minWidth: 50 },
      { field: 'MeasuredBy', headerName: 'MeasuredBy', minWidth: 50 },
      { field: 'SiteNotes', headerName: 'Notes', minWidth: 50 },
      {
        field: "actions",
        headerName: "Actions",
        renderCell: function render({ row }) {
          return <><EditButton hideText recordItemId={row.PointID} />
            <ShowButton hideText recordItemId={row.PointID} /></>;
        },
        align: "center",
        headerAlign: "center",
        minWidth: 80,
        flex: 0.3,
      },
    ],
    []
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <WIPAlert />
      <List
        title="Manual Water Levels"
      >
        <DataGrid
          {...dataGridProps}
          filterDebounceMs={settings.filterDebounceMs}
          rowHeight={settings.rowHeight}
          getRowId={(row) => row.OBJECTID}
          columns={columns}
          autoHeight
        />
      </List>
    </Box>
  );
};

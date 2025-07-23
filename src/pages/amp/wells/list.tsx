import { useMemo } from "react";
import { ShowButton, EditButton, useDataGrid } from "@refinedev/mui";
import { type GridColDef } from "@mui/x-data-grid";
import type { IWell } from "@/interfaces/amp";
import { Box } from "@mui/material";
import { WIPAlert, ListPage } from "@/components";


export const WellList: React.FC = () => {

  const { dataGridProps } = useDataGrid<IWell>();
  const columns = useMemo<GridColDef<IWell>[]>(
    () => [
      {
        field: "PointID",
        headerName: "ID",
        type: "string",
        minWidth: 150,
      },
      {
        field: "OSEWellID",
        headerName: "OSEWellID",
        type: "string",
        minWidth: 150,
      },
      {
        field: "OSEWelltagID",
        headerName: "OSEWelltagID",
        type: "string",
        minWidth: 150,
      },
      {
        field: "formation",
        headerName: "Formation",
        type: "string",
        minWidth: 150,
      },
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
      <ListPage columns={columns} dataGridProps={dataGridProps} title="Wells" />
    </Box>
  );
};

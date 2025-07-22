import { useMemo } from "react";
import { ShowButton, EditButton, useDataGrid } from "@refinedev/mui";
import { type GridColDef } from "@mui/x-data-grid";
import type { ILocation } from "@/interfaces/amp";
import { publicReleaseChip } from "@/components/util";
import { WIPAlert, ListPage } from "@/components";
import { Box } from "@mui/material";


export const LocationList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ILocation>();
  const columns = useMemo<GridColDef<ILocation>[]>(
    () => [
      {
        field: "PointID",
        headerName: "PointID",
        type: "string",
        minWidth: 150,
      },
      {
        field: "SiteID",
        headerName: "Site ID",
        type: "string",
        minWidth: 150,
      },
      {
        field: "Easting",
        headerName: "Easting",
        type: "string",
      },
      {
        field: "Northing",
        headerName: "Northing",
        type: "string",
      },
      {
        field: "latitude",
        headerName: "Latitude",
        type: "string",
        minWidth: 150,
        renderCell: function render({ row }) {
          return row.geometry.coordinates[1];
        },
      },
      {
        field: "longitude",
        headerName: "Longitude",
        type: "string",
        minWidth: 150,
        renderCell: function render({ row }) {
          return row.geometry.coordinates[0];
        },
      },
      {
        field: "PublicRelease",
        headerName: "Public",
        minWidth: 120,
        flex: 0.3,
        renderCell: publicReleaseChip,
      },
      {
        field: "actions",
        headerName: "Actions",
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.PointID} />
              <ShowButton hideText recordItemId={row.PointID} />
            </>
          );
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
      <ListPage columns={columns} dataGridProps={dataGridProps} title="Locations" />
    </Box>);
};

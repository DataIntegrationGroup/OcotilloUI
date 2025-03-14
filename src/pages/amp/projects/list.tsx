import { useMemo } from "react";
import { ShowButton, EditButton, useDataGrid } from "@refinedev/mui";
import { GridColDef } from "@mui/x-data-grid";
import { IProject, IWell } from "@/interfaces/amp";
import { ListPage } from "@/components/ListPage";

export const AMPProjectList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IProject>();

  const columns = useMemo<GridColDef<IProject>[]>(
    () => [
      {
        field: "Project",
        headerName: "Name",
        type: "string",
        minWidth: 200,
      },
      {
        field: "PointIDPrefix",
        headerName: "PointID Prefix",
        type: "string",
        minWidth: 150,
      },
      {
        field: "actions",
        headerName: "Actions",
        renderCell: function render({ row }) {
          return (
            <>
              <EditButton hideText recordItemId={row.Project} />
              <ShowButton hideText recordItemId={row.Project} />
            </>
          );
        },
        align: "center",
        headerAlign: "center",
        minWidth: 80,
        flex: 0.3,
      },
    ],
    [],
  );

  return (
    <ListPage
      columns={columns}
      dataGridProps={dataGridProps}
      getRowId={(row) => row.Project}
    />
  );
};

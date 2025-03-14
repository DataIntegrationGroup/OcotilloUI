import { useMemo } from "react";
import { ShowButton, EditButton, useDataGrid } from "@refinedev/mui";
import { GridColDef } from "@mui/x-data-grid";
import { IEquipment } from "@/interfaces/amp";
import { ListPage } from "@/components/ListPage";

export const EquipmentList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IEquipment>();

  const columns = useMemo<GridColDef<IEquipment>[]>(
    () => [
      {
        field: "ID",
        headerName: "ID",
        type: "number",
        minWidth: 50,
      },
      {
        field: "PointID",
        headerName: "PointID",
        type: "string",
        minWidth: 150,
      },
      {
        field: "EquipmentType",
        headerName: "EquipmentType",
        type: "string",
        minWidth: 150,
      },
      {
        field: "Model",
        headerName: "Model",
        type: "string",
        minWidth: 150,
      },
      {
        field: "SerialNo",
        headerName: "SerialNumber",
        type: "string",
      },
      {
        field: "DateInstalled",
        headerName: "DateInstalled",
        type: "string",
      },
      {
        field: "DateRemoved",
        headerName: "DateRemoved",
        type: "string",
        flex: 1,
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
      },
    ],
    [],
  );

  return (
    <ListPage
      columns={columns}
      exportProps={{ pageSize: 50 }} // something weird with the database/API pagination for Equipment.
      // pageSize >50 results in the API missing some results which
      // prevents the useExport hook from ever completing.
      getRowId={(row) => row.ID}
      dataGridProps={dataGridProps}
    />
  );
};

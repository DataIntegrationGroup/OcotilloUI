import { List, useDataGrid } from "@refinedev/mui";
import React from "react";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import type { IMeasuringAgency, ILookupTable } from "@/interfaces/amp";

export const MeasuringAgencyList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IMeasuringAgency>();
  const columns = React.useMemo<GridColDef<IMeasuringAgency>[]>(
    () => [
      {
        field: "Agency",
        headerName: "Code",
        type: "string",
        minWidth: 150,
      },
      {
        field: "Description",
        headerName: "Description",
        type: "string",
        minWidth: 150,
        flex: 1,
      },
    ],
    [],
  );

  return (
    <List>
      <DataGrid
        {...dataGridProps}
        rowHeight={25}
        getRowId={(row) => row.Agency}
        columns={columns}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "Mui-even" : "Mui-odd"
        }
      />
    </List>
  );
};
export const LookupTableList: React.FC = () => {
  const { dataGridProps } = useDataGrid<ILookupTable>();
  const columns = React.useMemo<GridColDef<ILookupTable>[]>(
    () => [
      {
        field: "Code",
        headerName: "Code",
        type: "string",
        minWidth: 150,
      },
      {
        field: "Meaning",
        headerName: "Meaning",
        type: "string",
        minWidth: 150,
        flex: 1,
      },
    ],
    [],
  );

  return (
    <List>
      <DataGrid
        {...dataGridProps}
        rowHeight={25}
        getRowId={(row) => row.Code}
        columns={columns}
      />
    </List>
  );
};

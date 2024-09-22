import { useMany } from "@refinedev/core";
import { ShowButton, EditButton, List, useDataGrid } from "@refinedev/mui";
import React from "react";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import type { ICategory, IManualWaterLevel } from "../../interfaces";

export const ManualWaterLevelList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IManualWaterLevel>();

  // const categoryIds = dataGridProps.rows.map((item) => item.category.id);
  // const { data: categoriesData, isLoading } = useMany<ICategory>({
  //   resource: "categories",
  //   ids: categoryIds,
  //   queryOptions: {
  //     enabled: categoryIds.length > 0,
  //   },
  // });

  const columns = React.useMemo<GridColDef<IManualWaterLevel>[]>(
    () => [
      {
        field: "PointID",
        headerName: "ID",
        type: "string",
        minWidth: 150,
      },
      // {
      //   field: "SiteID",
      //   headerName: "Site ID",
      //   type: "string",
      //   minWidth: 150,
      // },
      // { field: "title", headerName: "Title", minWidth: 400, flex: 1 },
      // {
      //   field: "category.id",
      //   headerName: "Category",
      //   type: "number",
      //   headerAlign: "left",
      //   align: "left",
      //   minWidth: 250,
      //   flex: 0.5,
      //   renderCell: function render({ row }) {
      //     if (isLoading) {
      //       return "Loading...";
      //     }
      //
      //     const category = categoriesData?.data.find(
      //       (item) => item.id === row.category.id,
      //     );
      //     return category?.title;
      //   },
      // },
      // { field: "PublicRelease", headerName: "Public", minWidth: 120, flex: 0.3 },
      {
        field: "actions",
        headerName: "Actions",
        renderCell: function render({ row }) {
          return <><EditButton hideText recordItemId={row.PointID} />
              <ShowButton hideText recordItemId={row.PointID}/></>;
        },
        align: "center",
        headerAlign: "center",
        minWidth: 80,
          flex: 0.3,
      },
    ],
      []
    // [categoriesData, isLoading],
  );

  return (
    <List>
      <DataGrid {...dataGridProps}
                rowHeight={25}
                getRowId={(row) => row.PointID}
                columns={columns} autoHeight />
    </List>
  );
};

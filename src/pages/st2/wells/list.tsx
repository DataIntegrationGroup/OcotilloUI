import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {ILocation, IWell} from "@/interfaces/st2";
import {ListPage} from "@/components/ListPage";


export const ST2WellList: React.FC = () => {

    const {dataGridProps} = useDataGrid<IWell>(
        {
            resource: "Things",
            dataProviderName: "st2",
        }
    );

    // const categoryIds = dataGridProps.rows.map((item) => item.category.id);
    // const { data: categoriesData, isLoading } = useMany<ICategory>({
    //   resource: "categories",
    //   ids: categoryIds,
    //   queryOptions: {
    //     enabled: categoryIds.length > 0,
    //   },
    // });
    const columns = React.useMemo<GridColDef<IWell>[]>(
        () => [
            {
                field: "@iot.id",
                headerName: "ID",
                type: "string",
                minWidth: 150,
            },
            {
                field: "name",
                headerName: "name",
                type: "string",
                minWidth: 150,
            },
            {
                field: "agency",
                headerName: "Agency",
                valueGetter: (value, row) => row.properties?.agency,
                minWidth: 150,
            },
            // {
            //     field: "Easting",
            //     headerName: "Easting",
            //     type: "string",
            // },
            // {
            //     field: "Northing",
            //     headerName: "Northing",
            //     type: "string",
            // },
            // {
            //     field: "latitude",
            //     headerName: "Latitude",
            //     type: "string",
            //     minWidth: 150,
            //     renderCell: function render({row}) {
            //         return row.geometry.coordinates[1];
            //     },
            // },
            // {
            //     field: "longitude",
            //     headerName: "Longitude",
            //     type: "string",
            //     minWidth: 150,
            //     renderCell: function render({row}) {
            //         return row.geometry.coordinates[0];
            //     },
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
            // {
            //     field: "PublicRelease",
            //     headerName: "Public",
            //     minWidth: 120,
            //     flex: 0.3,
            //     renderCell: publicReleaseChip,
            // },
            {
                field: "actions",
                headerName: "Actions",
                renderCell: function render({row}) {
                    return (
                        <>
                            <EditButton hideText recordItemId={row['@iot.id']}/>
                            <ShowButton hideText recordItemId={row['@iot.id']}/>
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
        // [categoriesData, isLoading],
    );

    return (<ListPage
        getRowId={(row) => row["@iot.id"]}
        columns={columns} dataGridProps={dataGridProps}/>);
};

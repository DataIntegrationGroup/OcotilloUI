import {ShowButton, EditButton, List, useDataGrid, ExportButton} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {ILocation} from "@/interfaces/amp";
import {publicReleaseChip} from "@/components/util";
import {ListPage} from "@/components/ListPage";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {useForm} from "@refinedev/react-hook-form";
import {Button} from "@mui/material";
import Box from "@mui/material/Box";


export const LocationList: React.FC = () => {
    const {dataGridProps, search, filters} = useDataGrid<ILocation>();
    const columns = React.useMemo<GridColDef<ILocation>[]>(
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
                renderCell: function render({row}) {
                    return row.geometry.coordinates[1];
                },
            },
            {
                field: "longitude",
                headerName: "Longitude",
                type: "string",
                minWidth: 150,
                renderCell: function render({row}) {
                    return row.geometry.coordinates[0];
                },
            },
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
                renderCell: function render({row}) {
                    return (
                        <>
                            <EditButton hideText recordItemId={row.PointID}/>
                            <ShowButton hideText recordItemId={row.PointID}/>
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

    const {register, handleSubmit} = useForm()
    return ( <Stack>
        {/*<Box*/}
        {/*    component="form"*/}
        {/*    sx={{*/}
        {/*        display: "flex",*/}
        {/*        flexDirection: "column",*/}
        {/*    }}*/}
        {/*    autoComplete="off"*/}
        {/*    onSubmit={handleSubmit(search)}*/}
        {/*>*/}
        {/*<TextField {...register('q')}*/}
        {/*id={'q'}*/}
        {/*/>*/}
        {/*    <Button type="submit" variant="contained">*/}
        {/*        Submit*/}
        {/*    </Button>*/}
        {/*</Box>*/}
        <ListPage columns={columns} dataGridProps={dataGridProps} />
    </Stack>);
};
// ============= EOF =============================================

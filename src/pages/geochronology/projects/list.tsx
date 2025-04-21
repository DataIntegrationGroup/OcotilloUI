import {useMany} from "@refinedev/core";
import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {IProject} from "../../../interfaces/geochronology";
import {Chip} from "@mui/material";
import {settings} from "../../../settings";


export const ProjectList: React.FC = () => {
    const {dataGridProps} = useDataGrid<IProject>();

    const columns = React.useMemo<GridColDef<IProject>[]>(
        () => [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number',
                minWidth: 50
            },
            {
                field: "name",
                headerName: "Name",
                type: "string",
                minWidth: 300,
            },

            {
                field: "actions",
                headerName: "Actions",
                renderCell: function render({row}) {
                    return (
                        <>
                            <EditButton hideText recordItemId={row.id}/>
                            <ShowButton hideText recordItemId={row.id}/>
                        </>
                    );
                },
                align: "center",
                headerAlign: "center",
                minWidth: 80,
            },
        ],
        []
    );

    return (
        <List>
            <DataGrid
                {...dataGridProps}
                rowHeight={settings.rowHeight}
                getRowId={(row) => row.id}
                columns={columns}
                autoHeight
            />
        </List>
    );
};

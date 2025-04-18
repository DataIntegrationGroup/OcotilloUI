import {useMany} from "@refinedev/core";
import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {ISample} from "@/interfaces/geochronology";
import {Chip} from "@mui/material";
import {settings} from "@/settings";


export const SampleList: React.FC = () => {
    const {dataGridProps} = useDataGrid<ISample>();

    const columns = React.useMemo<GridColDef<ISample>[]>(
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
                field: "material",
                headerName: "Material",
                type: "string",
                minWidth: 200,
                renderCell: function render({row}) {
                    return (
                        <a href={`materials/show/${row.material.id}`}>
                            <Chip size='small' label={row.material.name}/>
                        </a>
                    )
                },
            },
            {
                field: "project",
                headerName: "Project",
                type: "string",
                minWidth: 200,
                renderCell: function render({row}) {
                    return (
                        <a href={`projects/show/${row.project.id}`}>
                            <Chip size='small' label={row.project.name}/>
                        </a>
                    )
                },
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
// ============= EOF =============================================

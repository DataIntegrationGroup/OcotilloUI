import {useMany} from "@refinedev/core";
import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {IPrincipalInvestigator} from "../../../interfaces/geochronology";
import {Chip} from "@mui/material";
import {settings} from "../../../settings";


export const PrincipalInvestigatorList: React.FC = () => {
    const {dataGridProps} = useDataGrid<IPrincipalInvestigator>();

    const columns = React.useMemo<GridColDef<IPrincipalInvestigator>[]>(
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
                field: "first_initial",
                headerName: "First Initial",
                type: "string",
                minWidth: 200,
            },
            {
                field: "last_name",
                headerName: "Last Name",
                type: "string",
                minWidth: 200,
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

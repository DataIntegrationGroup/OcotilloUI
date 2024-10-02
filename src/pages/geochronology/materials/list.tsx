// ===============================================================================
// Copyright 2024 Jake Ross
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================


import {useMany} from "@refinedev/core";
import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {IMaterial} from "../../../interfaces/geochronology";
import {Chip} from "@mui/material";
import {settings} from "../../../settings";


export const MaterialList: React.FC = () => {
    const {dataGridProps} = useDataGrid<IMaterial>();

    const columns = React.useMemo<GridColDef<IMaterial>[]>(
        () => [
            {field: 'id',
                headerName: 'ID',
                type: 'integer',
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
// ============= EOF =============================================

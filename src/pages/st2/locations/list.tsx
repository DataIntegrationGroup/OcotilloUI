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

import {ShowButton, EditButton, List, useDataGrid, ExportButton} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {ILocation} from "@/interfaces/st2";
import {ListPage} from "@/components/ListPage";
import Stack from "@mui/material/Stack";


export const ST2LocationList: React.FC = () => {
    const {dataGridProps, search, filters} = useDataGrid<ILocation>(
        {
            resource: "Locations",
            dataProviderName: "st2",
            meta: {
                filter: "properties/agency eq 'BernCo'"
            }
        }
    );
    const columns = React.useMemo<GridColDef<ILocation>[]>(
        () => [
            {
                field: "@iot.id",
                headerName: "ID",
                type: "string",
                minWidth: 150,
            },
            {
                field: "name",
                headerName: "Name",
                type: "string",
                minWidth: 300,
            },
            {
                field: "agency",
                headerName: "Agency",
                valueGetter: params => params.row.properties?.agency,
                minWidth: 150,
            },
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
    );

    return (<Stack>
        <ListPage
            getRowId={(row) => row["@iot.id"]}
            columns={columns} dataGridProps={dataGridProps}/>
    </Stack>);
};
// ============= EOF =============================================

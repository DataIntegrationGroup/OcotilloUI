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

import type {IEquipment} from "../../interfaces";
import {Chip} from "@mui/material";

export const EquipmentList: React.FC = () => {
    const {dataGridProps} = useDataGrid<IEquipment>();

    const columns = React.useMemo<GridColDef<IEquipment>[]>(
        () => [
            {field: 'ID',
                headerName: 'ID',
                type: 'number',
                minWidth: 50
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
              field: 'DateInstalled',
                headerName: 'DateInstalled',
                type: 'string',
            },
            {
                field: 'DateRemoved',
                headerName: 'DateRemoved',
                type: 'string',
                flex: 1
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
            },
        ],
        []
    );

    return (
        <List>
            <DataGrid
                {...dataGridProps}
                rowHeight={40}
                getRowId={(row) => row.ID}
                columns={columns}
                autoHeight
            />
        </List>
    );
};
// ============= EOF =============================================

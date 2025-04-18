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
                valueGetter: (value, row) => row.properties?.agency,
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

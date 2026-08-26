import {Button, Stack} from "@mui/material";
import {useGo, useOne, useParsed, useShow} from "@refinedev/core";
import {useAccessCapabilities} from "@/hooks";
import {canEnterGeothermalData} from "./recordsGridLogic";
import {
    Show,
    TextFieldComponent as TextField, useDataGrid,
} from "@refinedev/mui";
import {settings} from "@/settings";
import {DataGrid, type GridColDef} from "@mui/x-data-grid";
import React from "react";
import type {IWellRecord} from "@/interfaces/geothermal";


export const GeoThermalWellShow = () => {
    const {id} = useParsed();
    const go = useGo();
    const {canManageGeothermal} = useAccessCapabilities();

    const {query, result: record} = useShow({
        resource: "thing/geothermal-well",
        id: id,
        dataProviderName: "geothermal",
    });

    const {query: boreQuery} = useOne({
        resource: "thing/geothermal-well",
        id: `${id}/bore`,
        dataProviderName: "geothermal",
    });

    const {dataGridProps} = useDataGrid<IWellRecord>(
        {
            dataProviderName: "geothermal",
            resource: `thing/geothermal-well/${id}/records`,
        }
    );

    const columns = React.useMemo<GridColDef<IWellRecord>[]>(
        () => [
            {
                field: "OBJECTID",
                headerName: "ID",
                type: "number",
                minWidth: 150,
            },
            {
                field: "API_suffix",
                headerName: "API_suffix",
            },
            {
                field: "ActionDate",
                headerName: "ActionDate",
            },
            {
                field: "Comments",
                headerName: "Comments",
            },
            {
                field: "EnteredBy",
                headerName: "EnteredBy",
            },
            {
                field: "EntryDate",
                headerName: "EntryDate",
            },
            {
                field: "RecrdSetID",
                headerName: "RecrdSetID",
            },
            {
                field: "SourceID",
                headerName: "SourceID",
            },
            {
                field: "WellDataID",
                headerName: "WellDataID",
            },
            {
                field: "WellName",
                headerName: "WellName",
            },
            {
                field: "WellNumber",
                headerName: "WellNumber",
            },
        ], []
    )

    return (
        <Show isLoading={query.isLoading}>
            <Stack gap={1}>
                <TextField value={record?.name}/>
                <TextField value={record?.well_data_id}/>
                <TextField value={record?.county}/>
            </Stack>

            <Stack gap={1}>
                {canEnterGeothermalData(canManageGeothermal) && id != null && (
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{alignSelf: "flex-start"}}
                        onClick={() =>
                            go({to: `/geothermal/wells/records-grid/${id}`})
                        }
                    >
                        Open data-entry grid
                    </Button>
                )}
                <DataGrid
                    {...dataGridProps}
                    disableRowSelectionOnClick={false}
                    rowHeight={settings.rowHeight}
                    getRowId={(row) => row.OBJECTID}
                    columns={columns}
                    autoHeight
                    loading={query.isLoading || boreQuery.isLoading}
                />
            </Stack>

        </Show>
    );
};

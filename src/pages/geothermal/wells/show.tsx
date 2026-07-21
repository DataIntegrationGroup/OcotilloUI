import {Button, Stack, Typography} from "@mui/material";
import {useGo, useList, useOne, useParsed, useShow} from "@refinedev/core";
import {useAccessCapabilities} from "@/hooks";
import {
    DateField,
    MarkdownField,
    Show,
    TextFieldComponent as TextField, useDataGrid,
} from "@refinedev/mui";
import {settings} from "@/settings";
import {DataGrid, type GridColDef} from "@mui/x-data-grid";
import React from "react";
import type {IWell, IWellRecord} from "@/interfaces/geothermal";


export const GeoThermalWellShow = () => {
    const {id} = useParsed();
    const go = useGo();
    const {canManageGeothermal} = useAccessCapabilities();

    const {query, result: record} = useShow({
        resource: "wells",
        id: id,
        dataProviderName: "geothermal",
    });

    const {result: boreData, query: boreQuery} = useOne({
        resource: "wells",
        id: `${id}/bore`,
        dataProviderName: "geothermal",
    });

    const {dataGridProps} = useDataGrid<IWellRecord>(
        {
            dataProviderName: "geothermal",
            resource: `wells/${id}/records`,
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
    // const { data: categoryData, isLoading: categoryIsLoading } = useOne({
    //   resource: "categories",
    //   id: record?.category?.id || "",
    //   queryOptions: {
    //     enabled: !!record,
    //   },
    // });

    return (
        <Show isLoading={query.isLoading}>
            <Stack gap={1}>


                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*    {"PointID"}*/}
                {/*</Typography>*/}

                <TextField value={record?.OBJECTID}/>
                <TextField value={record?.WellDataID}/>
                <TextField value={record?.County}/>

                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Title"}*/}
                {/*</Typography>*/}
                {/*<TextField value={record?.title} />*/}

                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Content"}*/}
                {/*</Typography>*/}
                {/*<MarkdownField value={record?.content} />*/}

                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Category"}*/}
                {/*</Typography>*/}
                {/*{categoryIsLoading ? <>Loading...</> : <>{categoryData?.data?.title}</>}*/}
                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Status"}*/}
                {/*</Typography>*/}
                {/*<TextField value={record?.status} />*/}
                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"CreatedAt"}*/}
                {/*</Typography>*/}
                {/*<DateField value={record?.createdAt} />*/}
            </Stack>

            <Stack gap={1}>
                {canManageGeothermal && id != null && (
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
                    // onRowSelectionModelChange={handleSelectionChangeWrapper}
                    loading={query.isLoading || boreQuery.isLoading}
                />
            </Stack>

        </Show>
    );
};

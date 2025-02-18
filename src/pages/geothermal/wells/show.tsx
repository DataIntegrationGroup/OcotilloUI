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


import {Stack, Typography} from "@mui/material";
import {useList, useOne, useParsed, useShow} from "@refinedev/core";
import {
    DateField,
    MarkdownField,
    Show,
    TextFieldComponent as TextField, useDataGrid,
} from "@refinedev/mui";
import {settings} from "@/settings";
import {DataGrid, type GridColDef} from "@mui/x-data-grid";
import React from "react";
import type {IBore, ICasing, IWell, IWellRecord, IProduction, ILithStrat} from "@/interfaces/geothermal";
import {intFormatter} from "@/components/util";


export const GeoThermalWellShow = () => {
    const {id} = useParsed();

    // const {queryResult} = useShow({
    //     resource: "wells",
    //     id: id,
    //     dataProviderName: "geothermal",
    // });
    //
    // const {data, isLoading} = queryResult;
    //
    // const record = data?.data;

    // const {data: boreData, isLoading: boreIsLoading} = useOne({
    //     resource: "wells",
    //     id: `${id}/bore`,
    //     dataProviderName: "geothermal",
    // });

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
                valueFormatter: intFormatter
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

    const {dataGridProps: dataGridPropsBore} = useDataGrid<IBore>(
        {
            dataProviderName: "geothermal",
            resource: `wells/${id}/bore`,
        }
    );

    const boreColumns = React.useMemo<GridColDef<IBore>[]>(
        () => [
            {
                field: "OBJECTID",
                headerName: "ID",
                type: "number",
                minWidth: 150,
                valueFormatter: intFormatter
            },
            {
                field: "BoreUnits",
                headerName: "BoreUnits",
            },
            {
                field: "BoreDia",
                headerName: "BoreDia",
            },
            {
                field: "FromDepth",
                headerName: "from Depth (ft)",
            },
            {
                field: "ToDepth",
                headerName: "to Depth (ft)",
            },
            {
                field: "RecrdsetID",
                headerName: "RecrdsetID",
            }
        ], []
    )

    const {dataGridProps: dataGridPropsCasing} = useDataGrid<ICasing>(
        {
            dataProviderName: "geothermal",
            resource: `wells/${id}/casing`,
        }
    );

    const casingColumns = React.useMemo<GridColDef<ICasing>[]>(
        () => [
            {
                field: "OBJECTID",
                headerName: "ID",
                type: "number",
                minWidth: 150,
                valueFormatter: intFormatter
            },
            {
                field: "CasingDiam",
                headerName: "Casing Diameter",
                minWidth: 150,
            },
            {
                field: "Depth",
                headerName: "Depth (ft)",
                minWidth: 150,
            },
            {
                field: "RecrdsetID",
                headerName: "RecrdsetID",
            }
        ], []
    )

    const {dataGridProps: dataGridPropsProduction} = useDataGrid<IProduction>(
        {
            dataProviderName: "geothermal",
            resource: `wells/${id}/production`,
        }
    );

    const productionColumns = React.useMemo<GridColDef<IProduction>[]>(
        () => [
            {
                field: "InitialProd",
                headerName: "Initial Production",
                minWidth: 150,
            },
            // {
            //     field: "Method",
            //     headerName: "Method",
            //     minWidth: 150,
            // },
            {
                field: "MethodDescription",
                headerName: "Method Description",
                minWidth: 150,
            },
            {
                field: "RecrdsetID",
                headerName: "RecrdsetID",
            }
        ], []
    )

    const {dataGridProps: dataGridPropsLithStrat} = useDataGrid<IProduction>(
        {
            dataProviderName: "geothermal",
            resource: `wells/${id}/lithstrat`,
        }
    );

    const lithStratColumns = React.useMemo<GridColDef<ILithStrat>[]>(
        () => [
            {
                field: "LithClass",
                headerName: "Lith Class",
                minWidth: 150,
            },
            {
                field: "UnitBasis",
                headerName: "Unit Basis",
                minWidth: 150,
            },
            {
                field: "UnitName",
                headerName: "Unit Name",
                minWidth: 150,
            },
            // {
            //     field: "WithinUnit",
            //     headerName: "Within Unit",
            // },
            // {
            //     field: "Top_Qual",
            //     headerName: "Top Qual",
            // },
            {
                field: "Depth2Top",
                headerName: "Depth to Top",
            },
            // {
            //     field: "Top_TVD",
            //     headerName: "Top TVD",
            // },
            {
                field: "Elev_Top",
                headerName: "Elev Top",
            },
            // {
            //     field: "Botm_Qual",
            //     headerName: "Botm Qual",
            // },
            // {
            //     field: "Depth2Botm",
            //     headerName: "Depth To Bottom",
            // },
            // {
            //     field: "Bottom_TVD",
            //     headerName: "Bottom TVD",
            // },
            // {
            //     field: "Elev_Bot",
            //     headerName: "Elev Bot",
            // },
            {
                field: "DpthMethod",
                headerName: "Depth Method",
            },
            // {
            //     field: "PickConfid",
            //     headerName: "Pick Confid",
            // },
            // {
            //     field: "Absent",
            //     headerName: "Absent",
            // }
        ], []
    )


    // const { data: categoryData, isLoading: categoryIsLoading } = useOne({
    //   resource: "categories",
    //   id: record?.category?.id || "",
    //   queryOptions: {
    //     enabled: !!record,
    //   },
    // });
    const isLoading = dataGridPropsProduction.loading || dataGridPropsCasing.loading || dataGridPropsBore.loading || dataGridProps.loading;
    return (
        <Show isLoading={isLoading}>
            {/*<Stack gap={1}>*/}


            {/*<Typography variant="body1" fontWeight="bold">*/}
            {/*    {"PointID"}*/}
            {/*</Typography>*/}

            {/*<TextField value={record?.OBJECTID}/>*/}
            {/*<TextField value={record?.WellDataID}/>*/}
            {/*<TextField value={record?.County}/>*/}

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
            {/*</Stack>*/}

            <Stack gap={1}>
                <h3>Records</h3>
                <DataGrid
                    {...dataGridProps}
                    disableRowSelectionOnClick={false}
                    rowHeight={settings.rowHeight}
                    getRowId={(row) => row.OBJECTID}
                    columns={columns}
                    // onRowSelectionModelChange={handleSelectionChangeWrapper}
                    // loading={isLoading}
                />
            </Stack>
            <Stack gap={1}>
                <h3>LithStrat</h3>
                <DataGrid
                    {...dataGridPropsLithStrat}
                    disableRowSelectionOnClick={false}
                    // rowHeight={settings.rowHeight}
                    getRowId={(row) => row.OBJECTID}
                    columns={lithStratColumns}
                    // onRowSelectionModelChange={handleSelectionChangeWrapper}
                    // loading={isLoading}
                />
            </Stack>
            <Stack gap={1}>
                <h3>Bore</h3>
                <DataGrid
                    {...dataGridPropsBore}
                    disableRowSelectionOnClick={false}
                    // rowHeight={settings.rowHeight}
                    getRowId={(row) => row.OBJECTID}
                    columns={boreColumns}
                    // onRowSelectionModelChange={handleSelectionChangeWrapper}
                    // loading={isLoading}
                />
            </Stack>
            <Stack gap={1}>
                <h3>Casing</h3>
                <DataGrid
                    {...dataGridPropsCasing}
                    disableRowSelectionOnClick={false}
                    // rowHeight={settings.rowHeight}
                    getRowId={(row) => row.OBJECTID}
                    columns={casingColumns}
                    // onRowSelectionModelChange={handleSelectionChangeWrapper}
                    // loading={isLoading}
                />
            </Stack>
            <Stack gap={1}>
                <h3>Production</h3>
                <DataGrid
                    {...dataGridPropsProduction}
                    disableRowSelectionOnClick={false}
                    // rowHeight={settings.rowHeight}
                    getRowId={(row) => row.OBJECTID}
                    columns={productionColumns}
                    // onRowSelectionModelChange={handleSelectionChangeWrapper}
                    // loading={isLoading}
                />
            </Stack>
        </Show>
    );
};
// ============= EOF =============================================

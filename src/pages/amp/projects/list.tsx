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


import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React from "react";

import {DataGrid, type GridColDef} from "@mui/x-data-grid";

import type {IProject, IWell} from "@/interfaces/amp";
import {ListPage} from "@/components/ListPage";


export const AMPProjectList: React.FC = () => {

    const {dataGridProps} = useDataGrid<IProject>();

    // const categoryIds = dataGridProps.rows.map((item) => item.category.id);
    // const { data: categoriesData, isLoading } = useMany<ICategory>({
    //   resource: "categories",
    //   ids: categoryIds,
    //   queryOptions: {
    //     enabled: categoryIds.length > 0,
    //   },
    // });
    const columns = React.useMemo<GridColDef<IProject>[]>(
        () => [
            {
                field: "Project",
                headerName: "Name",
                type: "string",
                minWidth: 200,
            },
            {
                field: "PointIDPrefix",
                headerName: "PointID Prefix",
                type: "string",
                minWidth: 150,
            },

            // {
            //   field: "SiteID",
            //   headerName: "Site ID",
            //   type: "string",
            //   minWidth: 150,
            // },
            // { field: "title", headerName: "Title", minWidth: 400, flex: 1 },
            // {
            //   field: "category.id",
            //   headerName: "Category",
            //   type: "number",
            //   headerAlign: "left",
            //   align: "left",
            //   minWidth: 250,
            //   flex: 0.5,
            //   renderCell: function render({ row }) {
            //     if (isLoading) {
            //       return "Loading...";
            //     }
            //
            //     const category = categoriesData?.data.find(
            //       (item) => item.id === row.category.id,
            //     );
            //     return category?.title;
            //   },
            // },
            // { field: "PublicRelease", headerName: "Public", minWidth: 120, flex: 0.3 },
            {
                field: "actions",
                headerName: "Actions",
                renderCell: function render({row}) {
                    return <><EditButton hideText recordItemId={row.Project}/>
                        <ShowButton hideText recordItemId={row.Project}/></>;
                },
                align: "center",
                headerAlign: "center",
                minWidth: 80,
                flex: 0.3,
            },
        ],
        []
        // [categoriesData, isLoading],
    );

    return ( <ListPage
        columns={columns} dataGridProps={dataGridProps}
        getRowId={(row) => row.Project}/>);
};
// ============= EOF =============================================

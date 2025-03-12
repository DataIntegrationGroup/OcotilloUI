// ===============================================================================
// Author:  Jake Ross
// Copyright  New Mexico Bureau of Geology & Mineral Resources
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// ===============================================================================


import {Card, CardContent} from "@mui/material";
import Stack from "@mui/material/Stack";
import {DataGrid} from "@mui/x-data-grid";
import {useDataGrid} from "@refinedev/mui";

export default function AMPLSLint() {

    // const {dataGridProps: policyGridProps} = useDataGrid(
    //     {
    //         resource: 'policies',
    //         meta: {
    //             // params: params,
    //         },
    //         dataProviderName: 'governor'
    //     }
    // )
    //
    // const {dataGridProps: resultGridProps} = useDataGrid(
    //     {
    //         resource: 'results',
    //         meta: {
    //             // params: params,
    //         },
    //         dataProviderName: 'governor'
    //     }
    // )

    const policy_columns = [
        {field: 'name', headerName: 'Name', width: 200},
        {field: 'description', headerName: 'Description', width: 200},
        {field: 'created_at', headerName: 'Created', width: 200},
    ]

    const result_columns = [
        {field: 'name', headerName: 'Name', width: 200},
        {field: 'description', headerName: 'Description', width: 200},
        {field: 'created_at', headerName: 'Created', width: 200},
    ]

    return (
        <div>
            <h1>AMPLSLint</h1>
            <Stack direction={'row'} spacing={2}>
                <Card title={'Policies'}>
                    <CardContent>
                        <DataGrid columns={policy_columns}/>
                    </CardContent>
                </Card>
                <Card title={'Results'}>
                    <CardContent>
                        <DataGrid columns={result_columns}/>
                    </CardContent>
                </Card>
            </Stack>

            <Card title={'Detail View'} sx={{'marginTop': '20px'}}>
                <CardContent>
                    selected issue
                </CardContent>
            </Card>


        </div>
    )
}

// ============= EOF =============================================
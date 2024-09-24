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
import {useOne, useShow} from "@refinedev/core";
import {
    DateField,
    MarkdownField,
    Show,
    TextFieldComponent as TextField,
} from "@refinedev/mui";


export const ManualWaterLevelShow = () => {
    const isLoading = false;
    // const {queryResult} = useShow({});
    //
    // const {data, isLoading} = queryResult;
    //
    // const record = data?.data;

    // const { data: categoryData, isLoading: categoryIsLoading } = useOne({
    //   resource: "categories",
    //   id: record?.category?.id || "",
    //   queryOptions: {
    //     enabled: !!record,
    //   },
    // });

    return (
        <Show isLoading={isLoading}>
            <Stack gap={1}>
                <Typography variant="body1" fontWeight="bold">
                    {"PointID"}
                </Typography>

                {/*<TextField value={record?.id} />*/}

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
        </Show>
    );
};
// ============= EOF =============================================

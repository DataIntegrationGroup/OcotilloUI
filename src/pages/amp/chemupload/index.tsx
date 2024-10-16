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

import Typography from "@mui/material/Typography";
import {Card} from "@mui/material";
import Stack from "@mui/material/Stack";
import {useImport, useShow} from "@refinedev/core";
import Box from "@mui/material/Box";
import {Create} from "@refinedev/mui";
import {useState} from "react";

interface IChemUpload {

}
export const ChemUpload = () => {
    // const {query} = useShow({
    //     resource: 'chemupload',
    //     id: 'chemupload',
    //     dataProviderName: 'amp'
    // });
    // const stats = query.data?.data
    // console.log(query.data?.data)
    const [importProgress, setImportProgress] = useState({
        processed: 0,
        total: 0,
    });

    const { inputProps, isLoading } = useImport<IChemUpload>({
        resource: "products",
        onFinish: () => {
            alert("Import completed!");
        },
        onProgress: (progress) => {
            setImportProgress({
                processed: progress.processedAmount,
                total: progress.totalAmount,
            });
        },
    });

    return (
        <Card sx={{p: 3}}>
            {isLoading ? (
                <p>
                    {importProgress.processed} / {importProgress.total}
                </p>
            ) : (
                <p>Import CSV</p>
            )}
            <input name="csv" {...inputProps} />
        </Card>
    )
}
// ============= EOF =============================================
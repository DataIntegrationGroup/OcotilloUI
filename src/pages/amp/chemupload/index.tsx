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

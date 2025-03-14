import { Card } from "@mui/material";
import { useImport } from "@refinedev/core";
import { useState } from "react";
import { IManualWaterLevel } from "@/interfaces/amp";

export default function ManualWaterLevelsBatchUpload() {
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
  });

  const { inputProps, isLoading } = useImport<IManualWaterLevel>({
    resource: "manualwaterlevels",
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
    <Card sx={{ p: 3 }}>
      <h3>Manual Water Levels Batch Upload</h3>

      {isLoading ? (
        <p>
          {importProgress.processed} / {importProgress.total}
        </p>
      ) : (
        <p>Import CSV</p>
      )}
      <input name="csv" {...inputProps} />
    </Card>
  );
}

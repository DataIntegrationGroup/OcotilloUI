import { Card, Box } from '@mui/material'
import { useImport } from '@refinedev/core'
import { useState } from 'react'
import { ImportButton } from '@refinedev/mui'

interface IChemUpload {}

interface EntryProps {}

export const WaterChemistryApp: React.FC<EntryProps> = () => {
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
  })

  const { inputProps, isLoading } = useImport<IChemUpload>({
    resource: 'water-chemistry-app',
    dataProviderName: 'dataforge',
    onFinish: () => {
      alert('Import completed!')
    },
    onProgress: (progress) => {
      setImportProgress({
        processed: progress.processedAmount,
        total: progress.totalAmount,
      })
    },
  })

  return (
    <Box>
      <Card sx={{ p: 3 }}>
        <h1>Water Chemistry App</h1>
        <p> Use this app to upload data from a lab generated CSV file.</p>
        <p>Stay tuned for more updates!</p>
      </Card>
      <Card sx={{ p: 3 }}>
        {isLoading ? (
          <p>
            {importProgress.processed} / {importProgress.total}
          </p>
        ) : (
          <p>Import CSV</p>
        )}
        <ImportButton inputProps={inputProps} />
      </Card>
    </Box>
  )
  // return (
  //   <div>
  //     <h1>Water Chemistry App</h1>
  //     <p>This app is designed to manage and analyze water chemistry data.</p>
  //     <p>
  //       It supports various features such as data entry, analysis, and
  //       reporting.
  //     </p>
  //     <p>Stay tuned for more updates!</p>
  //
  //
  //   </div>
  // )
}

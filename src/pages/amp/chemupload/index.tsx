import { useState } from 'react'
import { Card } from '@mui/material'
import { useImport } from '@refinedev/core'

interface IChemUpload {}

export const ChemUpload = () => {
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
  })

  const { inputProps, isLoading } = useImport<IChemUpload>({
    resource: 'products',
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
    <Card sx={{ p: 3 }}>
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

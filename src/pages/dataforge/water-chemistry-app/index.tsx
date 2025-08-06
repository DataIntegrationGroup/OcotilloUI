import { Card, Box, Button, Input, Typography } from '@mui/material'
import { useImport } from '@refinedev/core'
import { useState } from 'react'
import { ImportButton } from '@refinedev/mui'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid'
import { date } from 'yup'
import {
  ID_COL,
  IUploadSchema,
  PARAMETER_COL,
  RESULT_COL,
  RESULT_UNITS_COL,
  SAMPLE_DATE_COL,
} from '@/pages/dataforge/water-chemistry-app/column-schema'

interface IChemUpload {
  sampleDate: string
}

interface EntryProps {}

export const WaterChemistryApp: React.FC<EntryProps> = () => {
  const [isUploadLoading, setIsUploadLoading] = useState(false)
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
  })
  const [rows, setRows] = useState<IUploadSchema[]>()

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

  const onChangeHandler = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setIsUploadLoading(true)

      const target = event.target
      const file: File = (target.files as FileList)[0]

      console.log(file)
      //parse each line of the file and create an array of objects
      const fileContent = await file.text()
      const lines = fileContent.split('\n')
      const header = lines[0].split(',')
      console.log(header)

      lines.shift()
      const nrows = lines.map((line, index) => {
        const row = line.split(',')
        return {
          // id: row[ID_COL],
          id: index + 1,
          parameter: row[PARAMETER_COL],
          resultUnits: row[RESULT_UNITS_COL],
          result: row[RESULT_COL],
          sampleDate: row[SAMPLE_DATE_COL],
        }
      })

      setRows(nrows)
      setIsUploadLoading(false)
    } catch (error) {
      console.error('Error uploading file:', error)
      setIsUploadLoading(false)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 90,
      type: 'string',
    },
    {
      field: 'sampleDate',
      headerName: 'Sample Date',
      width: 150,
      type: 'string',
    },
    {
      field: 'parameter',
      headerName: 'Parameter',
      width: 150,
      type: 'string',
    },
    {
      field: 'resultUnits',
      headerName: 'Result Units',
      width: 150,
      type: 'string',
    },
    {
      field: 'result',
      headerName: 'Result',
      width: 150,
      type: 'string',
    },
    // { field: 'id', headerName: 'ID', width: 90 },
    // { field: 'name', headerName: 'Name', width: 150 },
    // { field: 'value', headerName: 'Value', width: 150 },
    // Add more columns as needed
  ]

  return (
    <Box>
      <Card sx={{ p: 2, m: 2 }}>
        <h1>Water Chemistry App</h1>
        <p> Use this app to upload data from a lab generated CSV file.</p>
        <p>Stay tuned for more updates!</p>
      </Card>
      {/*<Card sx={{ p: 2, m: 2 }}>*/}
      {/*  {isLoading ? (*/}
      {/*    <p>*/}
      {/*      {importProgress.processed} / {importProgress.total}*/}
      {/*    </p>*/}
      {/*  ) : (*/}
      {/*    <p>Import CSV</p>*/}
      {/*  )}*/}
      {/*</Card>*/}
      <Card sx={{ p: 2, m: 2 }}>
        <label>
          <Input
            id="csv-input"
            type="file"
            sx={{ display: 'none' }}
            onChange={onChangeHandler}
          />
          <input id="file" type="hidden" />
          <Button
            loading={isUploadLoading}
            loadingPosition="end"
            endIcon={<FileUploadIcon />}
            variant="contained"
            component="span"
          >
            Upload
          </Button>
          <br />
        </label>
        {/*{errors.file && (*/}
        {/*  <Typography variant="caption" color="#fa541c">*/}
        {/*    {errors.file?.message?.toString()}*/}
        {/*  </Typography>*/}
        {/*)}*/}
        {/*</label>*/}
      </Card>

      <Card sx={{ p: 2, m: 2 }}>
        <DataGrid
          initialState={{
            pagination: { paginationModel: { pageSize: 5 } },
          }}
          pageSizeOptions={[5]}
          rows={rows}
          columns={columns}
        />
      </Card>
      <Card sx={{ p: 2, m: 2 }}>
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

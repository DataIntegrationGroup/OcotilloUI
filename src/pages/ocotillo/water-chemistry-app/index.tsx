import { Box, Button, Card, Input, useTheme } from '@mui/material'
import { useNotification } from '@refinedev/core'
import { useState } from 'react'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  IObservationUploadSchema,
  ISampleUploadSchema,
  PARAMETER_COL,
  RESULT_COL,
  RESULT_UNITS_COL,
  SAMPLE_DATE_COL,
  SAMPLE_ID_COL,
} from '@/pages/ocotillo/water-chemistry-app/column-schema'
import { useImportWaterChemistrySamples } from '@/pages/ocotillo/water-chemistry-app/hook'

interface EntryProps {}

export const WaterChemistryApp: React.FC<EntryProps> = () => {
  const [isUploadLoading, setIsUploadLoading] = useState(false)
  const [importProgress, setImportProgress] = useState({
    processed: 1,
    total: 0,
  })
  const [inputSamples, setInputSamples] = useState<ISampleUploadSchema[]>([])
  const [inputObservation, setInputObservation] = useState<
    IObservationUploadSchema[]
  >([])
  const [results, setResults] = useState({
    succeeded: [],
    errored: [],
  })

  const { open: openNotification, close: closeNotification } = useNotification()

  const { inputProps, isLoading, mutationResult, handleChange } =
    useImportWaterChemistrySamples({
      dataProviderName: 'ocotillo',
      // rows: rows,
      samples: inputSamples,
      observations: inputObservation,
      batchSize: 1, // Set to 1 for single row processing
      onFinish: (values) => {
        // use a notification to show summary of results
        openNotification({
          message: 'Import Results',
          description: `${values.succeeded.length} rows succeeded, ${values.errored.length} rows failed.`,
          type: 'success',
        })

        setResults(values)
      },
      onProgress: (progress) => {
        setImportProgress({
          processed: progress.processedAmount,
          total: progress.totalAmount,
        })
      },
    })

  const handleInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadLoading(true)

      const target = event.target
      const file: File = (target.files as FileList)[0]
      //parse each line of the file and create an array of objects
      const fileContent = await file.text()
      const lines = fileContent.split('\n')
      const header = lines[0].split(',')

      console.log(header)
      lines.shift()
      const cleanedLines = lines.filter((line) => line.trim() !== '')

      const nrows = cleanedLines.map((line, index) => {
        const row = line.split(',')
        return {
          // id: row[ID_COL],
          id: index + 1,
          observedProperty: row[PARAMETER_COL],
          resultUnits: row[RESULT_UNITS_COL],
          result: row[RESULT_COL],
          sampleDate: row[SAMPLE_DATE_COL],
          sampleId: row[SAMPLE_ID_COL],
        }
      })

      const sampleGroups = Object.groupBy(nrows, (row) => row.sampleId)
      const sampleRows = Object.entries(sampleGroups).map(
        ([sampleId, values], index) => {
          return {
            idx: index,
            sampleId: sampleId,
            sampleDate: values[0].sampleDate,
          } as ISampleUploadSchema
        }
      )
      setInputSamples(sampleRows)

      const observationRows = nrows.map(
        (row, index) =>
          ({
            idx: index,
            sampleId: row.sampleId,
            observedProperty: row.observedProperty,
            resultUnits: row.resultUnits,
            result: row.result,
            sampleDate: row.sampleDate,
          }) as IObservationUploadSchema
      )
      // .sort((a, b) => a.sampleId.localeCompare(b.sampleId))

      setInputObservation(observationRows)
      setIsUploadLoading(false)
    } catch (error) {
      console.error('Error uploading file:', error)
      setIsUploadLoading(false)
    }
  }

  const theme = useTheme()
  const stylizeSampleRow = (params) => {
    const { row } = params

    const success = results.succeeded.find(
      (result) =>
        result.request[0].row_idx === row.idx &&
        !result.request[0].observed_property
    )
    // console.log(results.errored)
    const error = results.errored.find(
      (result) =>
        result.request[0].idx === row.idx &&
        !result.request[0].observed_property
    )
    if (success) {
      return 'success-result-row'
    } else if (error) {
      return 'error-result-row'
    }

    return 'no-result-row'
  }
  const stylizeObservationRow = (params) => {
    const { row } = params

    const success = results.succeeded.find(
      (result) =>
        result.request[0].row_idx === row.idx &&
        result.request[0].observed_property
    )
    const error = results.errored.find(
      (result) =>
        result.request[0].idx === row.idx && result.request[0].observed_property
    )
    if (success) {
      return 'success-result-row'
    } else if (error) {
      return 'error-result-row'
    }

    return 'no-result-row'
  }

  const observationColumns: GridColDef[] = [
    {
      field: 'sampleId',
      headerName: 'Sample ID',
      width: 150,
      type: 'string',
    },
    {
      field: 'observedProperty',
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
  ]
  const sampleColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 90,
      type: 'string',
    },
    {
      field: 'sampleId',
      headerName: 'Sample ID',
      width: 150,
      type: 'string',
    },
    {
      field: 'sampleDate',
      headerName: 'Sample Date',
      width: 150,
      type: 'string',
    },
    // {
    //   field: 'parameter',
    //   headerName: 'Parameter',
    //   width: 150,
    //   type: 'string',
    // },
    // {
    //   field: 'resultUnits',
    //   headerName: 'Result Units',
    //   width: 150,
    //   type: 'string',
    // },
    // {
    //   field: 'result',
    //   headerName: 'Result',
    //   width: 150,
    //   type: 'string',
    // },
    // { field: 'id', headerName: 'ID', width: 90 },
    // { field: 'name', headerName: 'Name', width: 150 },
    // { field: 'value', headerName: 'Value', width: 150 },
    // Add more columns as needed
  ]

  return (
    <Box>
      <style>
        {`
          .error-result-row {
            background-color: ${theme.palette.error.dark} !important;
            color: white !important;
          }
          .success-result-row {
            background-color: ${theme.palette.success.dark} !important;
            color: white !important;
          }
        `}
      </style>
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
            onChange={handleInput}
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
        <Button loading={isLoading} variant="contained" {...inputProps}>
          Submit
        </Button>
        {isLoading ? (
          <p>
            {importProgress.processed} / {importProgress.total}
          </p>
        ) : (
          <p>Import CSV</p>
        )}
      </Card>
      <Card sx={{ p: 2, m: 2 }}>
        <DataGrid
          // initialState={{
          //   pagination: { paginationModel: { pageSize: 10 } },
          // }}
          // pageSizeOptions={[10]}
          getRowId={(row) => row.idx}
          rows={inputSamples}
          columns={sampleColumns}
          getRowClassName={stylizeSampleRow}
        />
      </Card>
      <Card sx={{ p: 2, m: 2 }}>
        <DataGrid
          // initialState={{
          //   pagination: { paginationModel: { pageSize: 10 } },
          // }}
          // pageSizeOptions={[10]}
          getRowId={(row) => row.idx}
          rows={inputObservation}
          columns={observationColumns}
          getRowClassName={stylizeObservationRow}
        />
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

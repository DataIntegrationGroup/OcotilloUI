import { DataGrid } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { settings } from '@/settings'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

export const OSEPODInfo = ({pod_id}) => {
  const [rows, setRows] = useState([])
  useEffect(() => {
    const url=`https://services2.arcgis.com/qXZbWTdPDbTjl7Dy/arcgis/rest/services/OSE_PODs/FeatureServer/0/query?where=+db_file%3D%27${pod_id}%27&f=pjson&outFields=*&outSR=4326`
    fetch(url).then((res) => res.json()).then((data) =>
    {
      if (data.features && data.features.length > 0) {
        const attributes = data.features[0].attributes
        const newRows = Object.keys(attributes).map((key, index) => ({
          id: index,
          name: key,
          value: attributes[key],
        }))
        setRows(newRows)
      } else {
        setRows([])
      }
    }).catch((error) => {
      console.error('Error fetching OSE POD info:', error)
    })

  }, [pod_id])

  return <>

    { rows.length === 0 &&
    <Typography variant="body1">
      No OSE POD data available for this well.
    </Typography>}
    { rows.length > 0 &&
    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
    <Table stickyHeader aria-label="sticky table">
      <TableHead>
        <TableRow>
          <TableCell><b>Name</b></TableCell>
          <TableCell><b>Value</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        { rows.map((row) => {
          let value
          console.log(row.name, row.name=='nmwrrs_wrsum_url')
          if (row.name=='nmwrrs_wrsum_url'){
            value = <div>
              <a target={'_blank'} href={row.value}>link</a>
            </div>
          }
          else{
            value=row.value
          }
            return <TableRow
              key={row.id}>
              <TableCell sx={{paddingTop: '2px', paddingBottom: '2px'}}>
                {row.name}
              </TableCell>
              <TableCell sx={{paddingTop: '2px', paddingBottom: '2px'}}>
                {value}
              </TableCell>

            </TableRow>
          })}
      </TableBody>
    </Table>
    </TableContainer>}
  </>
}
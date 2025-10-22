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


export const USGSInfo = ({site_id}) => {
  const [rows, setRows] = useState([])
  useEffect(() => {

    if (!site_id) return
    if (site_id=='N/A') return

    const url=`https://waterservices.usgs.gov/nwis/site/?format=rdb&site=${site_id}`
    fetch(url).then((res) => res.text()).then((data) =>
    {
      console.log(data)
    //   if (data.features && data.features.length > 0) {
    //     const attributes = data.features[0].attributes
    //     const newRows = Object.keys(attributes).map((key, index) => ({
    //       id: index,
    //       name: key,
    //       value: attributes[key],
    //     }))
    //     setRows(newRows)
    //   } else {
    //     setRows([])
    //   }
    }).catch((error) => {
      console.error('Error fetching OSE POD info:', error)
    })

  }, [site_id])

  return <>
    { rows.length === 0 &&
    <Typography variant="body1">
      No USGS data available for this well.
    </Typography>
    }

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
          {rows.map((row) => {
              return <TableRow
                key={row.id}>
                <TableCell sx={{paddingTop: '2px', paddingBottom: '2px'}}>
                  {row.name}
                </TableCell>
                <TableCell sx={{paddingTop: '2px', paddingBottom: '2px'}}>
                  {row.value}
                </TableCell>

              </TableRow>
            })}
        </TableBody>
      </Table>
    </TableContainer>
    }
    </>
}
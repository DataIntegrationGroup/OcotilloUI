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
import { useOSEPODInfo } from '@/hooks/useOSEPODInfo'

export const OSEPODInfo = ({pod_id}) => {
  const podInfoQuery = useOSEPODInfo(pod_id)
  return <>
    { podInfoQuery.data?.length === 0 &&
    <Typography variant="body1"
    color={'text.secondary'}
    padding={1}>
      No OSE POD data available for this well.
    </Typography>}

    {podInfoQuery.isError &&
      <Typography variant="body1"
      color={'warning.main'}
                  padding={1}
      >Error fetching OSE POD info.
      </Typography>}

    { podInfoQuery.data?.length > 0 &&
    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
    <Table stickyHeader aria-label="sticky table">
      <TableHead>
        <TableRow>
          <TableCell><b>Name</b></TableCell>
          <TableCell><b>Value</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        { podInfoQuery.data?.map((row) => {
          let value
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
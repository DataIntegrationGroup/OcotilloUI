import { IWell } from '@/interfaces/ocotillo/IThing'
import { Box, Typography } from '@mui/material'
import { HttpError, useShow } from '@refinedev/core'
import { useParams } from 'react-router-dom'

export const WellShowPdfPreview = () => {
  const { id } = useParams()
  const {
    queryResult: { data, isLoading: _isLoading },
  } = useShow<IWell, HttpError>({
    resource: 'thing-well',
    id,
  })

  const well = data?.data

  return (
    <Box>
      <Typography variant="h1">Well Report: {well?.name}</Typography>
      <pre>{JSON.stringify(well, null, 2)}</pre>
      {/* Add more PDF-only content here */}
    </Box>
  )
}

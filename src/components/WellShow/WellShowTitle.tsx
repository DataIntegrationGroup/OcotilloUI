import { Box, Skeleton, Typography } from '@mui/material'
import { WellStatusChips } from '@/components'
import { IWell } from '@/interfaces/ocotillo'

const BoxSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  flexWrap: 'wrap',
}

export const WellShowTitle = ({
  well,
  isLoading,
}: {
  well: IWell
  isLoading: boolean
}) => {
  return (
    <Box sx={BoxSx}>
      <Typography variant="h3" fontWeight={700}>
        {isLoading ? (
          <Skeleton variant="text" width={120} sx={{ fontSize: 'inherit' }} />
        ) : (
          (well?.name ?? '')
        )}
      </Typography>

      <WellStatusChips well={well} isLoading={isLoading} />
    </Box>
  )
}

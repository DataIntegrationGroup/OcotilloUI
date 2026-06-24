import { Box, Typography } from '@mui/material'

type LegendItem = {
  color: string
  label: string
}

type LegendComponentProps = {
  items: LegendItem[]
}

export const LegendComponent = ({ items }: LegendComponentProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h6">Legend</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
        {items.map((item, index: number) => (
          <Box
            key={index}
            sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}
          >
            <Box
              sx={{ width: 10, height: 10, backgroundColor: item.color }}
            ></Box>
            <Typography variant="body2">{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

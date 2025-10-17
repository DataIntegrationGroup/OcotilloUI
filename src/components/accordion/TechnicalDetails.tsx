import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Stack,
  Typography,
} from '@mui/material'
import { ExpandMore, Info } from '@mui/icons-material'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IWell } from '@/interfaces/ocotillo/IThing'

export const TechnicalDetailsAccordion = ({ well }: { well?: IWell }) => {
  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Info color="primary" />
          <Typography variant="body1" fontWeight="bold">
            Technical Details
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Card elevation={1}>
          <DynamicShowDisplay<IWell>
            record={well}
            fieldConfigs={fieldConfigs}
          />
        </Card>
      </AccordionDetails>
    </Accordion>
  )
}

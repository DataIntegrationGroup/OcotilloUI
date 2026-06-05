import { Box, Paper, Stack, Typography } from '@mui/material'

/**
 * Mock metadata for geothermal classification -- drawn from NM_Wells
 * tbl_well_headers (well class), tbl_ws_dst_headers (drill stem tests),
 * and Subsurface Library catalog references.
 */
const MOCK_GEOTHERMAL_META = {
  wellClass: 'Geothermal',
  drillStemTests: 2,
  dataQuality: 'Research Grade',
  subsurfaceLibraryRef: 'SL-1987-0042',
  lithology:
    'Granite and rhyolite from 0 to 1,200 ft; sandstone and siltstone from 1,200 to 2,000 ft.',
  status: 'Inactive',
  lastReviewed: 'March 2003',
}

export const GeothermalInformationAccordion = () => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Geothermal Classification
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <FieldRow label="Well Class" value={MOCK_GEOTHERMAL_META.wellClass} />
          <FieldRow label="Status" value={MOCK_GEOTHERMAL_META.status} />
          <FieldRow
            label="Drill Stem Tests"
            value={`${MOCK_GEOTHERMAL_META.drillStemTests} on record`}
          />
          <FieldRow
            label="Data Quality"
            value={MOCK_GEOTHERMAL_META.dataQuality}
          />
          <FieldRow
            label="Subsurface Ref"
            value={MOCK_GEOTHERMAL_META.subsurfaceLibraryRef}
          />
          <FieldRow
            label="Last Reviewed"
            value={MOCK_GEOTHERMAL_META.lastReviewed}
          />
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              display="block"
              sx={{ mb: 0.5 }}
            >
              Lithology
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              {MOCK_GEOTHERMAL_META.lithology}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  )
}

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '130px 1fr' },
      gap: 0.75,
      alignItems: 'start',
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
)

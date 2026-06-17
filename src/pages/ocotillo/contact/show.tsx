import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { useAccessCapabilities } from '@/hooks'
import { sanitizeContact } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import { Box, Chip, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { IContact } from '@/interfaces/ocotillo'
import {
  ContactDetailsCard,
  AssociatedSitesDetailsCard,
  AssociatedSitesMapCard,
} from '@/components/ContactShow'

export const ContactShow = () => {
  const { query, result } = useShow<IContact>({})
  const { canViewConfidential } = useAccessCapabilities()
  const rawRecord: IContact | undefined = result
  const record =
    rawRecord != null
      ? sanitizeContact(rawRecord, canViewConfidential)
      : undefined

  const contact = record

  return (
    <Show
      isLoading={query.isLoading}
      goBack={false}
      breadcrumb={false}
      wrapperProps={{
        elevation: 0,
        sx: {
          bgcolor: 'background.wrapper',
          boxShadow: 'none',
          borderRadius: 1,
          padding: 0,
        },
      }}
      title={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="h3" fontWeight={700}>
            {getContactDisplayName(contact ?? {})}
          </Typography>
          {contact?.role && (
            <Chip label={contact.role} size="small" variant="outlined" />
          )}
          {contact?.organization && (
            <Chip
              label={contact.organization}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      }
      headerProps={{
        sx: {
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          '.MuiCardHeader-action': {
            alignSelf: { xs: 'flex-end', md: 'flex-start' },
            mt: { xs: 1, md: 0.5 },
            mr: 0,
          },
        },
      }}
      contentProps={{ sx: { pt: 1 } }}
      headerButtons={() => null}
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          {/* Left column: 8 cols */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Stack spacing={2}>
              <AssociatedSitesDetailsCard things={contact?.things} />
              <AssociatedSitesMapCard things={contact?.things} />
            </Stack>
          </Grid>

          {/* Right column: 4 cols */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <Stack spacing={2}>
              <ContactDetailsCard contact={contact} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Show>
  )
}

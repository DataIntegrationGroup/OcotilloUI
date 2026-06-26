import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { useResourceParams } from '@refinedev/core'
import { PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccessCapabilities, useSidebarPanelSync } from '@/hooks'
import { sanitizeContact } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import { Chip } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Stack } from '@mui/material'
import { IContact } from '@/interfaces/ocotillo'
import {
  ContactDetailsCard,
  AssociatedSitesDetailsCard,
  AssociatedSitesMapCard,
} from '@/components/ContactShow'
import {
  ocotilloCardHeaderProps,
  OcotilloHeaderButtons,
  OcotilloPageTitle,
} from '@/components/OcotilloPageHeader'
import { EditPanelLayout } from '@/components/editing'
import { ContactEditPanel } from '@/components/ContactEdit/ContactEditPanel'

export const ContactShow = () => {
  const { id } = useResourceParams()
  const { query, result } = useShow<IContact>({})
  const { canViewConfidential, canEditAmp } = useAccessCapabilities()
  const rawRecord: IContact | undefined = result
  const record =
    rawRecord != null
      ? sanitizeContact(rawRecord, canViewConfidential)
      : undefined

  const contact = record

  const {
    isPanelOpen: isEditPanelOpen,
    closePanel: closeEditPanel,
    togglePanel: toggleEditPanel,
  } = useSidebarPanelSync()

  return (
    <EditPanelLayout
      open={isEditPanelOpen && Boolean(id)}
      pinPanel="sticky"
      panel={
        isEditPanelOpen && id ? (
          <ContactEditPanel
            contactId={id}
            contact={contact}
            isLoading={query.isLoading}
            onClose={closeEditPanel}
          />
        ) : null
      }
    >
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
          <OcotilloPageTitle title={getContactDisplayName(contact ?? {})}>
            {contact?.role ? (
              <Chip label={contact.role} size="small" variant="outlined" />
            ) : null}
            {contact?.organization ? (
              <Chip
                label={contact.organization}
                size="small"
                variant="outlined"
              />
            ) : null}
          </OcotilloPageTitle>
        }
        headerProps={ocotilloCardHeaderProps}
        contentProps={{ sx: { pt: 1 } }}
        headerButtons={() => (
          <OcotilloHeaderButtons>
            {canEditAmp ? (
              <Button
                variant={isEditPanelOpen ? 'default' : 'outline'}
                size="sm"
                onClick={toggleEditPanel}
              >
                <PencilIcon />
                <span className="hidden mobile-lg:inline">Edit</span>
              </Button>
            ) : null}
          </OcotilloHeaderButtons>
        )}
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
    </EditPanelLayout>
  )
}

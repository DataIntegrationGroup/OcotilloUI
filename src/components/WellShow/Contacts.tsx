import { useList } from '@refinedev/core'
import {
  Box,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Directions } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router'
import type { IContact } from '@/interfaces/ocotillo'
import { formatPhone, formatContactAddress, formatAddress } from '@/utils'

const getGoogleMapsAddressUrl = (address: string) => {
  if (!address || address === 'N/A') return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

const ContactBlock = ({ contact }: { contact: IContact }) => {
  const roleType =
    [contact.role, contact.contact_type].filter(Boolean).join(' / ') || null
  const emails =
    contact.emails?.map((e: { email?: string }) => e.email).filter(Boolean) ??
    []
  const phones =
    contact.phones
      ?.map((p: { phone_number?: string }) => p.phone_number)
      .filter(Boolean) ?? []
  const addresses = contact.addresses ?? []

  return (
    <Stack spacing={0.5} component="div">
      {roleType && (
        <Typography variant="body2" component="div">
          {roleType}
        </Typography>
      )}
      {contact.name && contact.id && (
        <Typography
          variant="body2"
          component={RouterLink}
          to={`/ocotillo/contact/show/${contact.id}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {contact.name}
        </Typography>
      )}
      {contact.name && !contact.id && (
        <Typography variant="body2" component="div">
          {contact.name}
        </Typography>
      )}
      {emails.map((email, idx) => (
        <Typography
          key={idx}
          variant="body2"
          component="a"
          href={`mailto:${email}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {email}
        </Typography>
      ))}
      {phones.map((phone, idx) => (
        <Typography
          key={idx}
          variant="body2"
          component="a"
          href={`tel:${phone}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {formatPhone(phone)}
        </Typography>
      ))}
      {addresses.map((addr, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary" component="div">
            {formatContactAddress(addr)}
          </Typography>
          {getGoogleMapsAddressUrl(formatAddress(addr)) && (
            <Tooltip title="Open in Google Maps">
              <IconButton
                size="small"
                component="a"
                href={getGoogleMapsAddressUrl(formatAddress(addr)) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ p: 0.25 }}
              >
                <Directions fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ))}
    </Stack>
  )
}

export const ContactsCard = ({ id }: { id?: number }) => {
  const { query } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      enabled: id != null,
    },
  })

  const isLoading: boolean = id == null || query.isLoading
  const contacts: IContact[] = query.data?.data ?? []

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Contacts
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {isLoading ? (
          <Stack spacing={2}>
            <Box>
              <Skeleton variant="text" width="40%" height={28} />
              <Skeleton variant="text" width="65%" />
              <Skeleton variant="text" width="55%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="65%" />
            </Box>
          </Stack>
        ) : contacts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        ) : (
          <Stack spacing={2}>
            {contacts.map((contact, i: number) => (
              <Box key={contact.id ?? i}>
                <ContactBlock contact={contact} />
                {i < contacts.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

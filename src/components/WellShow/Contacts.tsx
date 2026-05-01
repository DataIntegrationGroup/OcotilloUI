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
import { getContactDisplayName } from '@/utils/contactDisplayName'

const getGoogleMapsAddressUrl = (address: string) => {
  if (!address || address === 'N/A') return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

const formatAddressType = (type: string): string => {
  const lower = type.toLowerCase()
  if (lower.includes('physical') && lower.includes('mail')) return 'Physical & Mailing'
  if (lower.includes('physical')) return 'Physical'
  if (lower.includes('mail')) return 'Mailing'
  return type
}

const formatPhoneType = (type: string): string => {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

const ContactBlock = ({ contact }: { contact: IContact }) => {
  const roleType =
    [contact.role, contact.contact_type].filter(Boolean).join(' / ') || null
  const emails =
    contact.emails?.map((e: { email?: string }) => e.email).filter(Boolean) ??
    []
  const phones = contact.phones ?? []
  const addresses = contact.addresses ?? []

  const displayName = getContactDisplayName(contact)
  // When the contact has no personal name and the org is used as the display
  // name, suppress the org line below to avoid showing it twice.
  const isOrgOnlyContact =
    !contact.name?.trim() && !!contact.organization?.trim()
  const nameLabel = isOrgOnlyContact ? 'Organization' : 'Contact name'

  return (
    <Stack spacing={0.5} component="div">
      {roleType && (
        <Typography variant="body2" component="div">
          {roleType}
        </Typography>
      )}
      {displayName && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, display: 'block', letterSpacing: 0.3 }}
        >
          {nameLabel}
        </Typography>
      )}
      {displayName && contact.id && (
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
          {displayName}
        </Typography>
      )}
      {displayName && !contact.id && (
        <Typography variant="body2" component="div">
          {displayName}
        </Typography>
      )}
      {!isOrgOnlyContact && (
        <Typography variant="body2" color="text.secondary" component="div">
          {contact.organization || 'No organization listed'}
        </Typography>
      )}
      {emails.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, display: 'block', letterSpacing: 0.3, mt: 0.25 }}
        >
          Email
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
      {phones.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, display: 'block', letterSpacing: 0.3, mt: 0.25 }}
        >
          Phone
        </Typography>
      )}
      {phones.map((phone, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography
            variant="body2"
            component="a"
            href={`tel:${phone.phone_number}`}
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {formatPhone(phone.phone_number ?? '')}
          </Typography>
          {phone.phone_type && (
            <Typography variant="caption" color="text.secondary" component="span">
              {formatPhoneType(phone.phone_type)}
            </Typography>
          )}
        </Box>
      ))}
      {addresses.map((addr, idx) => (
        <Box key={idx}>
          {addr.address_type && (
            <Typography variant="caption" color="text.secondary" component="div">
              {formatAddressType(addr.address_type)}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
        </Box>
      ))}
    </Stack>
  )
}

export const ContactsCard = ({
  contacts,
  isLoading,
  siteName,
}: {
  contacts: IContact[]
  isLoading: boolean
  siteName?: string | null
}) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          {siteName || 'Contacts'}
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

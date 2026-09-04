import { DarkMode, LightMode, SettingsBrightness } from '@mui/icons-material'
import {
  Box,
  Chip,
  Container,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useGetIdentity } from '@refinedev/core'
import { jwtDecode } from 'jwt-decode'
import { useContext } from 'react'
import { ColorModeContext } from '@/contexts'
import { useAccessCapabilities, useBooleanPreference } from '@/hooks'
import { ApiKeysCard } from '@/pages/settings/ApiKeysCard'
import { SettingRow, SettingsCard } from '@/pages/settings/SettingsCard'
import { tokenStore } from '@/providers/authentik-provider'
import type { PortalRole } from '@/utils/accessControl'
import { PREFERENCE_KEYS } from '@/utils/preferences'
import {
  type ColorModePreference,
  formatSessionExpiry,
  groupRolesByPortal,
  initialsFromName,
  roleShortLabel,
} from '@/utils/userProfile'

/**
 * Session expiry comes off the id token rather than any app state: the token
 * is what actually ends the session, so anything else here would be a guess.
 */
const sessionExpiry = (): string | null => {
  const idToken = tokenStore.idToken
  if (!idToken) return null

  try {
    const { exp } = jwtDecode<{ exp?: number }>(idToken)
    return formatSessionExpiry(exp, new Date())
  } catch {
    return null
  }
}

/**
 * Read-only view of who the signed-in user is. Names, emails and roles all
 * come from Authentik, so this page shows them and says where to change them
 * rather than pretending to own them.
 */
export const ProfileCard = ({
  name,
  email,
  userId,
  expiry,
}: {
  name?: string
  email?: string
  userId?: string
  expiry: string | null
}) => (
  <SettingsCard
    title="Profile"
    description="From your NMBGMR single sign-on account. Contact an administrator to change your name or email."
  >
    <Stack direction="row" spacing={2} alignItems="center" sx={{ pb: 1 }}>
      <Box
        sx={(theme) => ({
          width: 56,
          height: 56,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: 'primary.main',
          fontWeight: 700,
        })}
      >
        {initialsFromName(name)}
      </Box>
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {name || 'Unknown user'}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ overflowWrap: 'anywhere' }}
        >
          {email || 'No email on this account'}
        </Typography>
      </Stack>
    </Stack>

    {userId ? (
      <SettingRow label="User ID">
        <Typography
          component="code"
          variant="caption"
          sx={{ overflowWrap: 'anywhere' }}
        >
          {userId}
        </Typography>
      </SettingRow>
    ) : null}

    {expiry ? (
      <SettingRow label="Session">
        <Typography variant="body2">{expiry}</Typography>
      </SettingRow>
    ) : null}
  </SettingsCard>
)

/**
 * What the signed-in user can reach, in the same role vocabulary the access
 * control provider uses — so a "why can't I see this page?" question can be
 * answered from here instead of from a token dump.
 */
export const AccessCard = ({
  roles,
  primaryRole,
}: {
  roles: PortalRole[]
  primaryRole: PortalRole | null
}) => {
  const groups = groupRolesByPortal(roles)

  return (
    <SettingsCard
      title="Access"
      description="Roles are granted in single sign-on and cannot be changed here."
    >
      {groups.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No portal roles are assigned to this account, so most pages will be
          hidden. An administrator can grant access.
        </Typography>
      ) : (
        groups.map((group) => (
          <SettingRow key={group.portal} label={group.portal}>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {group.roles.map((role) => (
                <Chip
                  key={role}
                  size="small"
                  label={roleShortLabel(role)}
                  color={role === primaryRole ? 'primary' : 'default'}
                  variant={role === primaryRole ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </SettingRow>
        ))
      )}
    </SettingsCard>
  )
}

export const AppearanceCard = ({
  preference,
  onChange,
}: {
  preference: ColorModePreference
  onChange: (next: ColorModePreference) => void
}) => (
  <SettingsCard
    title="Appearance"
    description="Applies to this browser only, and takes effect immediately."
  >
    <SettingRow label="Theme">
      <Stack spacing={0.75}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={preference}
          onChange={(_event, next: ColorModePreference | null) => {
            if (next) onChange(next)
          }}
          aria-label="Theme"
        >
          <ToggleButton value="light" aria-label="Light theme">
            <LightMode fontSize="small" sx={{ mr: 0.75 }} />
            Light
          </ToggleButton>
          <ToggleButton value="dark" aria-label="Dark theme">
            <DarkMode fontSize="small" sx={{ mr: 0.75 }} />
            Dark
          </ToggleButton>
          <ToggleButton value="system" aria-label="System theme">
            <SettingsBrightness fontSize="small" sx={{ mr: 0.75 }} />
            System
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          System follows your operating system setting, including when it
          switches on its own.
        </Typography>
      </Stack>
    </SettingRow>
  </SettingsCard>
)

/**
 * Shell behaviour that people reasonably disagree about. The map collapses the
 * sidebar on arrival to give the canvas the width; anyone navigating between
 * the map and the rest of the app all day would rather it stayed put.
 */
export const NavigationCard = ({
  autoCollapseOnMap,
  onAutoCollapseChange,
}: {
  autoCollapseOnMap: boolean
  onAutoCollapseChange: (next: boolean) => void
}) => (
  <SettingsCard
    title="Navigation"
    description="Applies to this browser only, and takes effect immediately."
  >
    <SettingRow label="Map page">
      <Stack spacing={0.75}>
        <FormControlLabel
          control={
            <Switch
              checked={autoCollapseOnMap}
              onChange={(event) => onAutoCollapseChange(event.target.checked)}
              inputProps={{ 'aria-label': 'Collapse the sidebar on the map' }}
            />
          }
          label="Collapse the sidebar on the map"
        />
        <Typography variant="caption" color="text.secondary">
          On by default, so the map gets the full width. Turn it off to keep the
          sidebar open when you open the map.
        </Typography>
      </Stack>
    </SettingRow>
  </SettingsCard>
)

export const SettingsPage = () => {
  const { data: user } = useGetIdentity<{
    id?: string
    name?: string
    email?: string
  }>()
  const { roles, primaryRole, canManageApiKeys } = useAccessCapabilities()
  const { preference, setMode } = useContext(ColorModeContext)
  const [autoCollapseOnMap, setAutoCollapseOnMap] = useBooleanPreference(
    PREFERENCE_KEYS.autoCollapseSidebarOnMap,
    true
  )

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Settings</Typography>
          <Typography variant="body1" color="text.secondary">
            Your account and how this app looks on this device.
          </Typography>
        </Box>

        <ProfileCard
          name={user?.name}
          email={user?.email}
          userId={user?.id}
          expiry={sessionExpiry()}
        />
        <AccessCard roles={roles} primaryRole={primaryRole} />
        <AppearanceCard preference={preference} onChange={setMode} />
        <NavigationCard
          autoCollapseOnMap={autoCollapseOnMap}
          onAutoCollapseChange={setAutoCollapseOnMap}
        />
        <ApiKeysCard canManageKeys={canManageApiKeys} />
      </Stack>
    </Container>
  )
}

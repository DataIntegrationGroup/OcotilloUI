import { fetcher } from '@/providers/ocotillo-data-provider'

/**
 * UI-surface grants: the widen-only half of access control.
 *
 * A role policy (`canAccessResource`) decides what a role may reach. A grant
 * can open one extra screen for one principal — `GET /access/decision` with a
 * `ui_surface` answers whether it does.
 *
 * Two rules this module exists to keep:
 *
 * * **Widen only.** This is asked only after the role policy has already said
 *   no, and its answer can only turn that into a yes. A grant never takes away
 *   what a role allows, so revoking one returns someone to exactly their role.
 * * **Default deny on failure.** A network error, a 401, or an unparseable
 *   answer is a no, which leaves the role policy's decision standing. An
 *   access-control outage must not hand out screens, and — because it cannot
 *   subtract — it cannot lock an admin out either.
 *
 * `can()` is called for every nav item on every render, so answers are cached
 * per surface for the session and in-flight requests are shared. Only surfaces
 * the role policy already denied are ever asked about, which bounds this to
 * one request per denied screen.
 */

const cache = new Map<string, boolean | Promise<boolean>>()

/** Clear the cache. Call on sign-out; used by tests between cases. */
export const resetUiSurfaceGrants = () => cache.clear()

const askDecision = async (surface: string): Promise<boolean> => {
  try {
    const response = await fetcher('access/decision', {
      params: { capability: 'read', ui_surface: surface },
    })
    return response.data?.allowed === true
  } catch {
    // Default deny. The role policy's answer stands.
    return false
  }
}

/**
 * Whether a grant opens this screen for the signed-in caller.
 *
 * A resolved answer is cached for the session: grants change rarely, and a
 * revocation takes effect on the next sign-in rather than mid-session. That is
 * the same bound the API documents for its own reads, and it is safe in the
 * widen-only direction — the worst case is a screen staying visible slightly
 * longer than the grant, and the data behind it is enforced server-side.
 */
export const isUiSurfaceGranted = (surface: string): Promise<boolean> => {
  const cached = cache.get(surface)
  if (cached !== undefined) return Promise.resolve(cached)

  // Store the promise, not just the result, so a burst of nav items rendering
  // at once shares one request rather than firing one apiece.
  const pending = askDecision(surface).then((allowed) => {
    cache.set(surface, allowed)
    return allowed
  })

  cache.set(surface, pending)
  return pending
}

/**
 * Actions a surface grant may widen.
 *
 * A surface grant is `read`: it says a screen may be seen, never that its
 * records may be written. Letting it widen `create`/`edit`/`delete` would turn
 * "can see this nav item" into edit rights, which is not what was granted.
 */
const READ_ACTIONS = new Set(['list', 'show'])

export const isGrantableAction = (action: string): boolean =>
  READ_ACTIONS.has(action)

import { jwtDecode } from 'jwt-decode'

export function isJwtExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token)
    if (!decoded.exp) return false // if no exp claim, treat as non-expiring
    const nowSec = Math.floor(Date.now() / 1000)
    return decoded.exp <= nowSec
  } catch {
    // If token is malformed, treat as expired/invalid
    return true
  }
}

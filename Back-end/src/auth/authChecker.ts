import type { Action } from 'routing-controllers'
import { verifyAccessToken, type AccessPayload } from './tokens.js'

function tokenFrom(action: Action): string | null {
  const header = action.request.headers['authorization'] as string | undefined
  if (!header) return null
  const [scheme, token] = header.split(' ')
  return scheme === 'Bearer' && token ? token : null
}

// routing-controllers calls this for @Authorized() / @Authorized('admin').
export async function authorizationChecker(
  action: Action,
  roles: string[],
): Promise<boolean> {
  const token = tokenFrom(action)
  if (!token) return false
  try {
    const payload = verifyAccessToken(token)
    if (roles.length > 0 && !roles.includes(payload.role)) return false
    return true
  } catch {
    return false
  }
}

// Populates @CurrentUser() with the decoded token (or undefined if not logged in).
export async function currentUserChecker(
  action: Action,
): Promise<AccessPayload | undefined> {
  const token = tokenFrom(action)
  if (!token) return undefined
  try {
    return verifyAccessToken(token)
  } catch {
    return undefined
  }
}

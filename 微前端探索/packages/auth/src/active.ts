import type { AuthAdapter } from '@admin/core'

let activeAuth: AuthAdapter | null = null

export function setActiveAuth(auth: AuthAdapter | null) {
  activeAuth = auth
}

export function getActiveAuth(): AuthAdapter | null {
  return activeAuth
}

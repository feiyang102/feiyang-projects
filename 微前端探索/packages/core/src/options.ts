import { z } from 'zod'
import type { AdminAppOptions, ResolvedOptions } from './types'

export const CURRENT_CONFIG_VERSION = 1

const KNOWN_KEYS = new Set([
  'configVersion',
  'app',
  'router',
  'modules',
  'routes',
  'auth',
  'layout',
  'loginComponent',
  'micro',
  'http',
  'menu',
  'theme',
  'session',
  'version',
  'notifications',
  'hooks',
  'errorReporter',
])

const optionsSchema = z
  .object({
    configVersion: z.number().int().positive(),
    app: z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      copyright: z.string().optional(),
    }),
    router: z
      .object({
        base: z.string().optional(),
        mode: z.enum(['history', 'hash']).optional(),
        history: z.unknown().optional(),
      })
      .optional(),
    modules: z.array(z.unknown()).optional(),
    routes: z.array(z.unknown()).optional(),
    auth: z.unknown().optional(),
    layout: z.unknown().optional(),
    loginComponent: z.unknown().optional(),
    micro: z.unknown().optional(),
    http: z.unknown().optional(),
    menu: z.unknown().optional(),
    theme: z.unknown().optional(),
    session: z.unknown().optional(),
    version: z.unknown().optional(),
    notifications: z.unknown().optional(),
    hooks: z.unknown().optional(),
    errorReporter: z.unknown().optional(),
  })
  .passthrough()

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>

const migrations: Record<number, Migration> = {}

const warned = new Set<string>()

function warnOnce(message: string) {
  if (warned.has(message)) return
  warned.add(message)
  // eslint-disable-next-line no-console
  console.warn(`[admin-core] ${message}`)
}

export function resetWarnings() {
  warned.clear()
}

export function runMigrations(raw: AdminAppOptions | Record<string, unknown>): Record<string, unknown> {
  let current = { ...(raw as Record<string, unknown>) }
  const version = typeof current.configVersion === 'number' ? current.configVersion : 1
  let cursor = version

  while (migrations[cursor]) {
    current = migrations[cursor](current)
    cursor += 1
    current.configVersion = cursor
  }

  return current
}

export function normalizeOptions(raw: AdminAppOptions | Record<string, unknown>): ResolvedOptions {
  const input = { ...(raw as Record<string, unknown>) }

  if (typeof input.configVersion !== 'number') {
    warnOnce('configVersion is missing; assuming version 1. Add configVersion to your options to silence this warning.')
    input.configVersion = 1
  } else if (input.configVersion > CURRENT_CONFIG_VERSION) {
    warnOnce(
      `configVersion ${input.configVersion} is newer than this framework supports (${CURRENT_CONFIG_VERSION}). Some options may be ignored.`,
    )
  }

  for (const key of Object.keys(input)) {
    if (!KNOWN_KEYS.has(key)) {
      warnOnce(`unknown option "${key}" was ignored.`)
    }
  }

  const migrated = runMigrations(input)
  const parsed = optionsSchema.safeParse(migrated)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ')
    throw new Error(`[admin-core] invalid options -> ${detail}`)
  }

  const options = parsed.data as unknown as AdminAppOptions

  return {
    ...options,
    configVersion: CURRENT_CONFIG_VERSION,
    router: {
      base: options.router?.base ?? '/',
      mode: options.router?.mode ?? 'history',
      history: options.router?.history,
    },
    modules: options.modules ?? [],
    routes: options.routes ?? [],
    http: options.http ?? {},
    loginPath: '/login',
  }
}

export function applyThemeTokens(tokens: Record<string, string> | undefined, target: HTMLElement = document.documentElement) {
  if (!tokens) return
  for (const [key, value] of Object.entries(tokens)) {
    target.style.setProperty(key, value)
  }
}

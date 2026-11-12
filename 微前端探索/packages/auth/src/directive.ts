import type { ObjectDirective } from 'vue'
import { getActiveAuth } from './active'

export type PermValue =
  | string
  | string[]
  | { codes: string | string[]; mode?: 'any' | 'all'; effect?: 'hide' | 'disable' }

interface NormalizedPerm {
  codes: string | string[]
  mode: 'any' | 'all'
  effect: 'hide' | 'disable'
}

const state = new WeakMap<HTMLElement, { value: PermValue; stop?: () => void }>()

function normalize(value: PermValue, modifiers: Partial<Record<string, boolean>>): NormalizedPerm {
  if (typeof value === 'string' || Array.isArray(value)) {
    return {
      codes: value,
      mode: modifiers.all ? 'all' : 'any',
      effect: modifiers.disable ? 'disable' : 'hide',
    }
  }
  return {
    codes: value.codes,
    mode: value.mode ?? (modifiers.all ? 'all' : 'any'),
    effect: value.effect ?? (modifiers.disable ? 'disable' : 'hide'),
  }
}

function apply(el: HTMLElement, value: PermValue, modifiers: Partial<Record<string, boolean>>) {
  const auth = getActiveAuth()
  if (!auth) return
  const { codes, mode, effect } = normalize(value, modifiers)
  const allowed = auth.can(codes, mode)

  if (effect === 'disable') {
    const disabled = !allowed
    el.toggleAttribute('disabled', disabled)
    el.classList.toggle('is-disabled', disabled)
    el.setAttribute('aria-disabled', String(disabled))
    return
  }

  el.style.display = allowed ? '' : 'none'
}

export const vPerm: ObjectDirective<HTMLElement, PermValue> = {
  mounted(el, binding) {
    const value = binding.value
    state.set(el, { value })
    apply(el, value, binding.modifiers)
    const auth = getActiveAuth()
    const stop = auth?.subscribe?.(() => {
      const current = state.get(el)
      if (current) apply(el, current.value, binding.modifiers)
    })
    const record = state.get(el)
    if (record) record.stop = stop
  },
  updated(el, binding) {
    const record = state.get(el)
    if (record) record.value = binding.value
    apply(el, binding.value, binding.modifiers)
  },
  unmounted(el) {
    state.get(el)?.stop?.()
    state.delete(el)
  },
}

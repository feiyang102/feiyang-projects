import { computed, reactive, ref } from 'vue'
import type { Ref } from 'vue'

export interface FormRule {
  required?: boolean
  pattern?: RegExp
  /** 字符串按长度、数字按数值比较 */
  min?: number
  max?: number
  message?: string
  validator?: (value: unknown, values: Record<string, unknown>) => string | true | Promise<string | true>
}

export type FormRules<T extends Record<string, unknown>> = Partial<
  Record<keyof T & string, FormRule | FormRule[]>
>

export interface UseFormOptions<T extends Record<string, unknown>> {
  initial: T
  rules?: FormRules<T>
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  values: T
  errors: Record<string, string>
  submitting: Ref<boolean>
  dirty: Ref<boolean>
  validate: () => Promise<boolean>
  validateField: (key: string) => Promise<string | undefined>
  reset: () => void
  /** 把当前值标记为已保存基线，dirty 随之变为 false */
  markSaved: () => void
  setValues: (patch: Partial<T>) => void
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

async function runRule(
  rule: FormRule,
  value: unknown,
  values: Record<string, unknown>,
): Promise<string | true> {
  if (rule.required && isEmpty(value)) {
    return rule.message ?? '该字段为必填项'
  }

  const hasValue = !isEmpty(value)
  if (hasValue) {
    const size = typeof value === 'number' ? value : String(value).length
    if (rule.min !== undefined && size < rule.min) return rule.message ?? `不能小于 ${rule.min}`
    if (rule.max !== undefined && size > rule.max) return rule.message ?? `不能大于 ${rule.max}`
    if (rule.pattern && !rule.pattern.test(String(value))) return rule.message ?? '格式不正确'
  }

  if (rule.validator) {
    const result = await rule.validator(value, values)
    if (result !== true) return typeof result === 'string' ? result : '校验未通过'
  }

  return true
}

export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>): UseFormReturn<T> {
  const buildInitial = () => ({ ...options.initial }) as T
  const values = reactive(buildInitial()) as T
  const errors = reactive<Record<string, string>>({})
  const submitting = ref(false)
  const baseline = ref(JSON.stringify(options.initial))

  function clearError(key: string) {
    if (key in errors) delete errors[key]
  }

  async function validateField(key: string): Promise<string | undefined> {
    const rules = options.rules?.[key]
    if (!rules) {
      clearError(key)
      return undefined
    }

    const list = Array.isArray(rules) ? rules : [rules]
    for (const rule of list) {
      const result = await runRule(rule, values[key], values as Record<string, unknown>)
      if (result !== true) {
        errors[key] = result
        return result
      }
    }

    clearError(key)
    return undefined
  }

  async function validate(): Promise<boolean> {
    let valid = true
    for (const key of Object.keys(options.rules ?? {})) {
      const error = await validateField(key)
      if (error) valid = false
    }
    return valid
  }

  function reset() {
    Object.assign(values, buildInitial())
    for (const key of Object.keys(errors)) delete errors[key]
    baseline.value = JSON.stringify(options.initial)
  }

  function setValues(patch: Partial<T>) {
    Object.assign(values, patch)
  }

  function markSaved() {
    baseline.value = JSON.stringify(values)
  }

  const dirty = computed(() => JSON.stringify(values) !== baseline.value)

  return { values, errors, submitting, dirty, validate, validateField, reset, markSaved, setValues }
}

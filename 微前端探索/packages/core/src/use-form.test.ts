import { describe, expect, it } from 'vitest'
import { useForm } from './use-form'

interface Values extends Record<string, unknown> {
  name: string
  age: number
  email: string
  tags: string[]
}

function setup() {
  return useForm<Values>({
    initial: { name: '', age: 0, email: '', tags: [] },
    rules: {
      name: [{ required: true, message: '请输入姓名' }, { min: 2, message: '至少 2 个字符' }],
      age: [{ min: 18, message: '需年满 18' }, { max: 120, message: '年龄不合法' }],
      email: [{ pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: '邮箱格式不正确' }],
      tags: [{ required: true, message: '至少选择一个标签' }],
    },
  })
}

describe('useForm', () => {
  it('reports required errors', async () => {
    const form = setup()
    await expect(form.validate()).resolves.toBe(false)
    expect(form.errors.name).toBe('请输入姓名')
    expect(form.errors.tags).toBe('至少选择一个标签')
  })

  it('applies min and max by string length or number value', async () => {
    const form = setup()
    form.setValues({ name: 'a', age: 12 })
    expect(await form.validateField('name')).toBe('至少 2 个字符')
    expect(await form.validateField('age')).toBe('需年满 18')

    form.setValues({ name: '张三', age: 30 })
    expect(await form.validateField('name')).toBeUndefined()
    expect(await form.validateField('age')).toBeUndefined()
  })

  it('validates patterns', async () => {
    const form = setup()
    form.setValues({ email: 'not-an-email' })
    expect(await form.validateField('email')).toBe('邮箱格式不正确')

    form.setValues({ email: 'a@b.com' })
    expect(await form.validateField('email')).toBeUndefined()
  })

  it('clears the error after passing', async () => {
    const form = setup()
    await form.validateField('name')
    expect(form.errors.name).toBe('请输入姓名')

    form.setValues({ name: '张三' })
    await form.validateField('name')
    expect(form.errors.name).toBeUndefined()
  })

  it('supports async custom validators', async () => {
    const form = useForm<{ code: string }>({
      initial: { code: '' },
      rules: {
        code: {
          validator: async (value) => (value === 'TAKEN' ? '已被占用' : true),
        },
      },
    })

    form.setValues({ code: 'TAKEN' })
    expect(await form.validateField('code')).toBe('已被占用')

    form.setValues({ code: 'FREE' })
    expect(await form.validateField('code')).toBeUndefined()
  })

  it('tracks dirty state and resets', async () => {
    const form = setup()
    expect(form.dirty.value).toBe(false)

    form.setValues({ name: '张三' })
    expect(form.dirty.value).toBe(true)

    await form.validateField('name')
    form.reset()
    expect(form.values.name).toBe('')
    expect(form.dirty.value).toBe(false)
    expect(form.errors.name).toBeUndefined()
  })

  it('returns true when all rules pass', async () => {
    const form = setup()
    form.setValues({ name: '张三', age: 30, email: 'a@b.com', tags: ['x'] })
    await expect(form.validate()).resolves.toBe(true)
  })

  it('marks the current values as saved baseline', () => {
    const form = setup()
    form.setValues({ name: '张三' })
    expect(form.dirty.value).toBe(true)

    form.markSaved()
    expect(form.dirty.value).toBe(false)

    form.setValues({ name: '李四' })
    expect(form.dirty.value).toBe(true)
  })
})

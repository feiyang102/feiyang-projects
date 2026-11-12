#!/usr/bin/env node
import { cp, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const templateDir = resolve(here, '../templates/module')

const args = process.argv.slice(2)
const name = args.find((arg) => !arg.startsWith('-'))
const dirIndex = args.indexOf('--dir')
const modulesDir = resolve(process.cwd(), dirIndex >= 0 ? args[dirIndex + 1] : 'src/modules')

if (!name) {
  console.error('用法: add-module <kebab-case-name> [--dir src/modules]')
  process.exit(1)
}

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(`模块名 "${name}" 不合法，请使用小写字母、数字与连字符（如 user-center）`)
  process.exit(1)
}

const targetDir = join(modulesDir, name)
if (existsSync(targetDir)) {
  console.error(`模块已存在: ${targetDir}`)
  process.exit(1)
}

await mkdir(modulesDir, { recursive: true })
await cp(templateDir, targetDir, { recursive: true })

const pascal = name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')

const variables = {
  __MODULE_NAME__: name,
  __MODULE_PASCAL__: pascal,
  __MODULE_TITLE__: pascal,
}

const TEXT_EXTENSIONS = ['.ts', '.vue', '.json', '.md', '.css']
async function replaceInTree(dir) {
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry)
    const info = await stat(full)
    if (info.isDirectory()) {
      await replaceInTree(full)
      continue
    }
    if (!TEXT_EXTENSIONS.some((ext) => entry.endsWith(ext))) continue
    let content = await readFile(full, 'utf8')
    for (const [key, value] of Object.entries(variables)) {
      content = content.split(key).join(value)
    }
    await writeFile(full, content)
  }
}

await replaceInTree(targetDir)
await rename(join(targetDir, 'views/Page.vue'), join(targetDir, `views/${pascal}.vue`))

console.log(`已创建模块: ${targetDir}`)
console.log('下一步在 main.ts 中注册:')
console.log(`  import ${pascal} from './modules/${name}'`)
console.log(`  modules: [..., ${pascal}]`)

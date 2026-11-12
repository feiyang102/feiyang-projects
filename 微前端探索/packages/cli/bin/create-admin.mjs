#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const templatesDir = resolve(here, '../templates')

const args = process.argv.slice(2)
const target = args.find((arg) => !arg.startsWith('-'))
const templateIndex = args.indexOf('--template')
const templateName = templateIndex >= 0 ? args[templateIndex + 1] : 'base'
const baseIndex = args.indexOf('--base')
const basePath = baseIndex >= 0 ? args[baseIndex + 1] : '/app'

if (!target) {
  console.error('用法: create-admin <目录> [--template base|sub-app] [--base /order]')
  process.exit(1)
}

const templateDir = join(templatesDir, templateName)
if (!existsSync(templateDir)) {
  console.error(`模板不存在: ${templateName}（可选: ${(await readdir(templatesDir)).join(', ')}）`)
  process.exit(1)
}

const targetDir = resolve(process.cwd(), target)
if (existsSync(targetDir)) {
  const entries = await readdir(targetDir)
  if (entries.length > 0) {
    console.error(`目标目录非空，已停止: ${targetDir}`)
    process.exit(1)
  }
}

await mkdir(targetDir, { recursive: true })
await cp(templateDir, targetDir, { recursive: true })

const appName = target.split('/').filter(Boolean).pop() ?? 'admin-app'
const appTitle = appName.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

const TEXT_EXTENSIONS = ['.json', '.ts', '.mts', '.js', '.mjs', '.vue', '.html', '.md', '.css']
const variables = {
  __APP_NAME__: appName,
  __APP_TITLE__: appTitle,
  __APP_BASE__: basePath.startsWith('/') ? basePath : `/${basePath}`,
}

async function replaceInTree(dir) {
  const entries = await readdir(dir)
  for (const entry of entries) {
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

console.log(`已生成 ${templateName} 模板: ${targetDir}`)
console.log('下一步:')
console.log(`  cd ${target}`)
console.log('  pnpm install')
console.log('  pnpm dev')

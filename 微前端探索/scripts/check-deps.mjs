import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()

const rules = {
  core: ['@admin/ui', '@admin/auth', '@admin/micro', 'element-plus', 'wujie'],
  ui: ['@admin/auth', '@admin/micro', 'wujie'],
  auth: ['@admin/ui', '@admin/micro', 'wujie'],
  micro: ['@admin/ui', '@admin/auth'],
  bridge: ['@admin/core', '@admin/ui', '@admin/auth', '@admin/micro'],
}

const files = []
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry === 'node_modules' || entry === 'dist') continue
    const info = statSync(full)
    if (info.isDirectory()) walk(full)
    else if (/\.(ts|vue|mts)$/.test(entry) && !entry.endsWith('.test.ts')) files.push(full)
  }
}

for (const pkg of Object.keys(rules)) {
  const src = join(root, 'packages', pkg, 'src')
  try {
    walk(src)
  } catch {
    // 包不存在时跳过
  }
}

let failed = 0
for (const file of files) {
  const pkg = relative(join(root, 'packages'), file).split('/')[0]
  const banned = rules[pkg] ?? []
  if (!banned.length) continue
  const content = readFileSync(file, 'utf8')
  for (const dep of banned) {
    const pattern = new RegExp(`from ['"]${dep.replace('/', '\\/')}['"]`)
    if (pattern.test(content)) {
      console.error(`✗ ${relative(root, file)} 不允许依赖 ${dep}`)
      failed += 1
    }
  }
}

if (failed > 0) {
  console.error(`\n依赖方向检查失败: ${failed} 处违规`)
  process.exit(1)
}
console.log('依赖方向检查通过')

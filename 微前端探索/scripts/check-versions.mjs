import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const expectedVersion = rootPkg.version

let failed = 0

for (const name of readdirSync(join(root, 'packages'))) {
  if (name.startsWith('.')) continue
  const pkgPath = join(root, 'packages', name, 'package.json')
  let pkg
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  } catch {
    continue
  }

  if (pkg.version !== expectedVersion) {
    console.error(`✗ ${pkg.name} 版本为 ${pkg.version}，应为 ${expectedVersion}`)
    failed += 1
  }

  for (const field of ['dependencies', 'peerDependencies']) {
    for (const [dep, range] of Object.entries(pkg[field] ?? {})) {
      if (!dep.startsWith('@admin/')) continue
      if (range !== 'workspace:*') {
        console.error(`✗ ${pkg.name} 的 ${field}.${dep} 应使用 workspace:*，实际为 ${range}`)
        failed += 1
      }
    }
  }
}

if (failed > 0) {
  console.error(`\n版本一致性检查失败: ${failed} 处问题`)
  process.exit(1)
}

console.log(`版本一致性检查通过（${expectedVersion}）`)

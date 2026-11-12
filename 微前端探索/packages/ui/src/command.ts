export interface CommandItem {
  key: string
  title: string
  path: string
  group?: string
}

export function filterCommands(items: CommandItem[], keyword: string, limit = 30): CommandItem[] {
  const value = keyword.trim().toLowerCase()
  const list = value
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(value) ||
          item.path.toLowerCase().includes(value) ||
          (item.group ?? '').toLowerCase().includes(value),
      )
    : items
  return list.slice(0, limit)
}

/**
 * 把最近访问的条目置顶，并标记为「最近访问」分组。
 * 未匹配到或重复的 key 会被忽略。
 */
export function mergeRecentCommands(
  items: CommandItem[],
  recentKeys: string[],
  group = '最近访问',
): CommandItem[] {
  if (!recentKeys.length) return items
  const map = new Map(items.map((item) => [item.key, item]))
  const seen = new Set<string>()
  const recent: CommandItem[] = []
  for (const key of recentKeys) {
    const item = map.get(key)
    if (!item || seen.has(key)) continue
    seen.add(key)
    recent.push({ ...item, group })
  }
  return [...recent, ...items.filter((item) => !seen.has(item.key))]
}

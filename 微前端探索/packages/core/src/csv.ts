import { downloadBlob } from './utils'

export interface CsvColumn<T = Record<string, unknown>> {
  key: string
  title: string
  format?: (value: unknown, row: T) => string
}

function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv<T extends object>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.title)).join(',')
  const body = rows
    .map((row) => {
      const record = row as Record<string, unknown>
      return columns
        .map((column) => escapeCell(column.format ? column.format(record[column.key], row) : record[column.key]))
        .join(',')
    })
    .join('\n')
  return body ? `${header}\n${body}` : header
}

export function exportCsv<T extends object>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const csv = toCsv(rows, columns)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

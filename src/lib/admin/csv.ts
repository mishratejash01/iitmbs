/**
 * Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, embedded
 * newlines). Returns an array of objects keyed by the header row.
 */
export function parseCsv(input: string): Array<Record<string, string>> {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const text = input.replace(/^﻿/, '')

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ''))
  if (!header) return []
  const keys = header.map((key) => key.trim())
  return body.map((cells) =>
    Object.fromEntries(keys.map((key, index) => [key, (cells[index] ?? '').trim()])),
  )
}

/** Quotes a CSV cell and neutralises spreadsheet formulas (=, +, -, @). */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

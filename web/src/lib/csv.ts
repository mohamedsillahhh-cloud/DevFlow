interface CsvColumn<Row> {
  label: string
  value: (row: Row) => string | number | boolean | null | undefined
}

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const serialized = value === null || value === undefined ? '' : String(value)

  if (serialized.includes('"') || serialized.includes(',') || serialized.includes('\n')) {
    return `"${serialized.replaceAll('"', '""')}"`
  }

  return serialized
}

export function downloadCsv<Row>(filename: string, columns: CsvColumn<Row>[], rows: Row[]) {
  const csvLines = [
    columns.map((column) => escapeCsvValue(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(column.value(row))).join(',')),
  ]

  const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

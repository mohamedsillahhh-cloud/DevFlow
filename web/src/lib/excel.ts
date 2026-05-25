import type { ExportPreset } from './export'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function autoFitColumns(worksheet: any) {
  if (!worksheet.columns) return
  worksheet.columns.forEach((column: any) => {
    const col = column as unknown as { values: unknown[] }
    if (!col.values) return
    let maxLength = 0
    col.values.forEach((value: unknown) => {
      const str = value ? String(value) : ''
      maxLength = Math.max(maxLength, str.length)
    })
    column.width = Math.min(Math.max(maxLength + 3, 10), 40)
  })
}

export async function exportToXlsx<Row>(
  preset: ExportPreset<Row>,
  data: Row[],
  suffix?: string,
  options?: { title?: string },
): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'DevFlow'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(options?.title ?? 'Dados')
  const { columns, filename } = preset

  worksheet.columns = columns.map((col) => ({
    header: col.label,
    key: col.key,
    width: 20,
  }))

  const headerRow = worksheet.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    const c = cell as unknown as Record<string, unknown>
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Inter' }
    c.alignment = { vertical: 'middle', horizontal: 'left' }
    c.border = { bottom: { style: 'thin', color: { argb: 'FF444444' } } }
  })

  data.forEach((row, index) => {
    const rowData: Record<string, unknown> = {}
    columns.forEach((col) => {
      rowData[col.key] = col.value(row) ?? ''
    })
    const excelRow = worksheet.addRow(rowData)

    excelRow.eachCell((cell) => {
      const c = cell as unknown as Record<string, unknown>
      c.font = { size: 10, name: 'Inter', color: { argb: 'FF333333' } }
      c.alignment = { vertical: 'middle' }
      c.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } }
      if (index % 2 === 1) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      }
    })
  })

  autoFitColumns(worksheet)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (workbook.xlsx as any).writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename(suffix)}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

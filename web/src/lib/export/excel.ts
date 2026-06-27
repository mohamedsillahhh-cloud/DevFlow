import type ExcelJS from 'exceljs'
import type { ExportColumn, ExportPreset } from './export'
import type { Gasto, Projeto, Receita, TempoProjeto } from '../types'
import { formatDate } from '../format'

function autoFitColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns?.forEach((column) => {
    if (!column.values) return
    let maxLength = 0
    column.values.forEach((value) => {
      const str = value ? String(value) : ''
      maxLength = Math.max(maxLength, str.length)
    })
    column.width = Math.min(Math.max(maxLength + 3, 10), 40)
  })
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  title: string,
  data: Record<string, number>,
) {
  const ws = workbook.addWorksheet(title)
  ws.columns = [
    { header: 'Categoria', key: 'categoria', width: 25 },
    { header: 'Total', key: 'total', width: 18 },
  ]

  const headerRow = ws.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })

  const entries = Object.entries(data).sort(([, a], [, b]) => b - a)
  let total = 0
  for (const [cat, val] of entries) {
    const row = ws.addRow({ categoria: cat, total: Math.round(val * 100) / 100 })
    const valueCell = row.getCell(2)
    valueCell.numFmt = '#,##0.00'
    total += val
  }

  const totalRow = ws.addRow({ categoria: 'TOTAL', total: Math.round(total * 100) / 100 })
  const totalCell = totalRow.getCell(2)
  totalCell.font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF1A1A1A' } }
  totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } }
  totalCell.numFmt = '#,##0.00'
  const totalLabel = totalRow.getCell(1)
  totalLabel.font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF1A1A1A' } }
  totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } }

  autoFitColumns(ws)
}

function getMonthLabel(dateStr: string) {
  if (!dateStr) return 'Sem data'
  return dateStr.substring(0, 7)
}

function styleHeaderRow<Row>(ws: ExcelJS.Worksheet, columns: ExportColumn<Row>[]) {
  ws.columns = columns.map((col) => ({
    header: col.label,
    key: col.key,
    width: 20,
  }))

  const headerRow = ws.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF444444' } } }
  })
}

function fillDataRows<Row>(
  ws: ExcelJS.Worksheet,
  columns: ExportColumn<Row>[],
  data: Row[],
) {
  data.forEach((row, index) => {
    const rowData: Record<string, unknown> = {}
    columns.forEach((col) => {
      rowData[col.key] = col.value(row) ?? ''
    })
    const excelRow = ws.addRow(rowData)
    excelRow.eachCell((cell) => {
      cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF333333' } }
      cell.alignment = { vertical: 'middle' }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } }
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      }
    })
  })

  autoFitColumns(ws)
}

async function saveWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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

  styleHeaderRow(worksheet, columns)
  fillDataRows(worksheet, columns, data)

  await saveWorkbook(workbook, filename(suffix))
}

export async function exportToXlsxCompleto(
  projetos: Projeto[],
  gastos: Gasto[],
  receitas: Receita[],
  sessoes: TempoProjeto[],
  suffix?: string,
): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'DevFlow'
  workbook.created = new Date()

  // Sheet: Lucro e Prejuízo
  const wsProfit = workbook.addWorksheet('Lucro e Prejuízo')
  wsProfit.columns = [
    { header: 'Indicador', key: 'indicador', width: 35 },
    { header: 'Valor', key: 'valor', width: 18 },
  ]

  const profitHeader = wsProfit.getRow(1)
  profitHeader.height = 28
  profitHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
  })

  const totalRec = receitas.reduce((s, r) => s + (r.valor || 0), 0)
  const totalGas = gastos.reduce((s, g) => s + (g.valor || 0), 0)
  const saldo = totalRec - totalGas
  const totalProj = projetos.reduce((s, p) => s + (p.valor_total || 0), 0)
  const totalPago = projetos.reduce((s, p) => s + (p.valor_pago || 0), 0)
  const totalHoras = sessoes.reduce((s, sess) => s + (sess.duracao_min || 0), 0)

  const profitData = [
    { indicador: 'Total de Receitas', valor: Math.round(totalRec * 100) / 100 },
    { indicador: 'Total de Gastos', valor: Math.round(totalGas * 100) / 100 },
    { indicador: 'Saldo (Receitas - Gastos)', valor: Math.round(saldo * 100) / 100 },
    { indicador: 'Total em Projetos', valor: Math.round(totalProj * 100) / 100 },
    { indicador: 'Total Recebido de Projetos', valor: Math.round(totalPago * 100) / 100 },
    { indicador: 'Saldo em Aberto (Projetos)', valor: Math.round(Math.max(totalProj - totalPago, 0) * 100) / 100 },
    { indicador: 'Total Horas Registradas', valor: Math.round(totalHoras / 60 * 10) / 10 },
  ]

  profitData.forEach((row) => {
    const r = wsProfit.addRow(row)
    const cell = r.getCell(2)
    cell.numFmt = '#,##0.00'
    cell.font = { size: 10, name: 'Calibri' }
  })

  autoFitColumns(wsProfit)

  // Summary: Receitas por mês
  const recPorMes: Record<string, number> = {}
  for (const r of receitas) {
    const mes = getMonthLabel(r.data)
    recPorMes[mes] = (recPorMes[mes] || 0) + (r.valor || 0)
  }
  addSummarySheet(workbook, 'Receitas por Mês', recPorMes)

  // Summary: Gastos por categoria
  const gastoPorCat: Record<string, number> = {}
  for (const g of gastos) {
    const cat = g.categoria_nome || 'Sem categoria'
    gastoPorCat[cat] = (gastoPorCat[cat] || 0) + (g.valor || 0)
  }
  addSummarySheet(workbook, 'Gastos por Categoria', gastoPorCat)

  // Summary: Gastos por mês
  const gastoPorMes: Record<string, number> = {}
  for (const g of gastos) {
    const mes = getMonthLabel(g.data)
    gastoPorMes[mes] = (gastoPorMes[mes] || 0) + (g.valor || 0)
  }
  addSummarySheet(workbook, 'Gastos por Mês', gastoPorMes)

  // Sheet: Projetos
  const wsProj = workbook.addWorksheet('Projetos')
  const projCols = [
    { key: 'cliente', label: 'Cliente', value: (p: Projeto) => {
      const rel = p.clientes
      const name = !rel ? null : Array.isArray(rel) ? rel[0]?.nome ?? null : rel.nome
      return name ?? 'Sem cliente'
    }},
    { key: 'projeto', label: 'Projeto', value: (p: Projeto) => p.titulo },
    { key: 'status', label: 'Status', value: (p: Projeto) => p.status ?? 'pendente' },
    { key: 'valor_total', label: 'Valor total', value: (p: Projeto) => (p.valor_total ?? 0).toFixed(2) },
    { key: 'valor_pago', label: 'Valor pago', value: (p: Projeto) => (p.valor_pago ?? 0).toFixed(2) },
    { key: 'em_aberto', label: 'Em aberto', value: (p: Projeto) => Math.max((p.valor_total ?? 0) - (p.valor_pago ?? 0), 0).toFixed(2) },
    { key: 'prazo', label: 'Prazo', value: (p: Projeto) => formatDate(p.prazo) },
  ] as ExportColumn<Projeto>[]
  styleHeaderRow(wsProj, projCols)
  fillDataRows(wsProj, projCols, projetos)

  // Sheet: Gastos
  const wsGas = workbook.addWorksheet('Gastos')
  const gastoCols = [
    { key: 'data', label: 'Data', value: (g: Gasto) => formatDate(g.data) },
    { key: 'descricao', label: 'Descrição', value: (g: Gasto) => g.descricao },
    { key: 'categoria', label: 'Categoria', value: (g: Gasto) => g.categoria_nome || 'Sem categoria' },
    { key: 'valor', label: 'Valor', value: (g: Gasto) => (g.valor || 0).toFixed(2) },
    { key: 'metodo', label: 'Método', value: (g: Gasto) => g.metodo ?? '' },
    { key: 'pago', label: 'Pago', value: (g: Gasto) => g.pago === 1 ? 'Sim' : 'Não' },
  ] as ExportColumn<Gasto>[]
  styleHeaderRow(wsGas, gastoCols)
  fillDataRows(wsGas, gastoCols, gastos)

  // Sheet: Receitas
  const wsRec = workbook.addWorksheet('Receitas')
  const recCols = [
    { key: 'data', label: 'Data', value: (r: Receita) => formatDate(r.data) },
    { key: 'descricao', label: 'Descrição', value: (r: Receita) => r.descricao },
    { key: 'valor', label: 'Valor', value: (r: Receita) => (r.valor || 0).toFixed(2) },
    { key: 'origem', label: 'Origem', value: (r: Receita) => r.origem ?? '' },
    { key: 'projeto', label: 'Projeto', value: (r: Receita) => {
      const rel = r.projetos
      const name = !rel ? null : Array.isArray(rel) ? rel[0]?.titulo ?? null : rel.titulo
      return name ?? ''
    }},
  ] as ExportColumn<Receita>[]
  styleHeaderRow(wsRec, recCols)
  fillDataRows(wsRec, recCols, receitas)

  const stamp = suffix ? `-${suffix}` : `-${new Date().toISOString().slice(0, 10)}`
  await saveWorkbook(workbook, `devflow-completo${stamp}`)
}

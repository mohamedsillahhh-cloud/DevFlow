import type { Gasto, Projeto, Receita, TempoProjeto } from '../types'
import { formatDate, getClientName, projectDueAmount } from '../format'

export async function exportToPdfCompleto(
  projetos: Projeto[],
  gastos: Gasto[],
  receitas: Receita[],
  sessoes: TempoProjeto[],
  filename?: string,
) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 15

  doc.setFontSize(18)
  doc.text('Relatório Completo DevFlow', margin, 20)
  doc.setFontSize(10)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, margin, 27)

  const totalRec = receitas.reduce((s, r) => s + (r.valor || 0), 0)
  const totalGas = gastos.reduce((s, g) => s + (g.valor || 0), 0)
  const saldo = totalRec - totalGas
  const totalProj = projetos.reduce((s, p) => s + (p.valor_total || 0), 0)
  const totalPago = projetos.reduce((s, p) => s + (p.valor_pago || 0), 0)
  const totalHoras = sessoes.reduce((s, sess) => s + (sess.duracao_min || 0), 0) / 60

  doc.setFontSize(14)
  doc.text('Resumo Financeiro', margin, 37)
  let lastY = 0
  autoTable(doc, {
    startY: 40,
    head: [['Indicador', 'Valor']],
    body: [
      ['Total de Receitas', `${totalRec.toFixed(2)}`],
      ['Total de Gastos', `${totalGas.toFixed(2)}`],
      ['Saldo', `${saldo.toFixed(2)}`],
      ['Total em Projetos', `${totalProj.toFixed(2)}`],
      ['Total Recebido de Projetos', `${totalPago.toFixed(2)}`],
      ['Saldo em Aberto', `${Math.max(totalProj - totalPago, 0).toFixed(2)}`],
      ['Total Horas Registradas', `${totalHoras.toFixed(1)}h`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60, halign: 'right' } },
    margin: { left: margin, right: margin },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastY = (autoTable as any).lastAutoTable.finalY + 10

  if (projetos.length > 0) {
    const y = lastY
    if (y > 250) doc.addPage()
    doc.setFontSize(14)
    doc.text('Projetos', margin, y)

    const projBody = projetos.map((p) => [
      getClientName(p),
      p.titulo,
      p.status ?? 'pendente',
      (p.valor_total ?? 0).toFixed(2),
      (p.valor_pago ?? 0).toFixed(2),
      projectDueAmount(p).toFixed(2),
    ])
    autoTable(doc, {
      startY: y + 4,
      head: [['Cliente', 'Projeto', 'Status', 'Total', 'Pago', 'Aberto']],
      body: projBody,
      theme: 'grid',
      headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (autoTable as any).lastAutoTable.finalY + 10
  }

  if (gastos.length > 0) {
    const y = lastY
    if (y > 250) doc.addPage()
    doc.setFontSize(14)
    doc.text('Gastos (últimos 50)', margin, y)

    const gastoBody = gastos.slice(0, 50).map((g) => [
      formatDate(g.data),
      g.descricao.substring(0, 50),
      g.categoria_nome || '-',
      (g.valor || 0).toFixed(2),
      g.pago === 1 ? 'Sim' : 'Não',
    ])
    autoTable(doc, {
      startY: y + 4,
      head: [['Data', 'Descrição', 'Categoria', 'Valor', 'Pago']],
      body: gastoBody,
      theme: 'grid',
      headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 15, halign: 'center' },
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (autoTable as any).lastAutoTable.finalY + 10
  }

  if (receitas.length > 0) {
    const y = lastY
    if (y > 250) doc.addPage()
    doc.setFontSize(14)
    doc.text('Receitas (últimas 50)', margin, y)

    const recBody = receitas.slice(0, 50).map((r) => [
      formatDate(r.data),
      r.descricao.substring(0, 50),
      r.origem || '-',
      (r.valor || 0).toFixed(2),
    ])
    autoTable(doc, {
      startY: y + 4,
      head: [['Data', 'Descrição', 'Origem', 'Valor']],
      body: recBody,
      theme: 'grid',
      headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 75 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'right' },
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastY = (autoTable as any).lastAutoTable.finalY + 10
  }

  const name = filename ? `devflow-relatorio-${filename}` : `devflow-relatorio-${new Date().toISOString().slice(0, 10)}`
  doc.save(`${name}.pdf`)
}

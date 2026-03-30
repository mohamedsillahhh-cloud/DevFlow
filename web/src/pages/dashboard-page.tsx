import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  RefreshCcw,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { ComparisonAreaChart, DonutChart, MiniBarChart } from '../components/data-viz'
import { FullScreenLoader } from '../components/full-screen-loader'
import { Panel } from '../components/panel'
import { StatCard } from '../components/stat-card'
import { StatusBadge } from '../components/status-badge'
import { useAsyncData } from '../hooks/use-async-data'
import { downloadCsv } from '../lib/csv'
import {
  BUTTON_SECONDARY,
  deadlineColor,
  formatCurrency,
  formatDate,
  formatPercent,
  getClientName,
  getRelationItem,
  getMonthBounds,
  groupByMonth,
  isOpenProject,
  isWithinDateRange,
  projectDueAmount,
  sortProjectsByDeadline,
  sumBy,
  toSortedAlerts,
} from '../lib/format'

import { fetchDashboardSnapshot } from '../lib/supabase-data'

const STATUS_DEFINITIONS = [
  {
    border: '#5a4722',
    color: 'var(--color-warning)',
    key: 'pendente',
    label: 'Pending',
    surface: 'rgba(140,96,15,0.18)',
  },
  {
    border: '#234a73',
    color: 'var(--color-info)',
    key: 'em_andamento',
    label: 'In progress',
    surface: 'rgba(26,72,133,0.2)',
  },
  {
    border: '#5e3f84',
    color: '#c98fff',
    key: 'pago_parcial',
    label: 'Partial paid',
    surface: 'rgba(118,72,194,0.18)',
  },
  {
    border: '#1f4a39',
    color: 'var(--color-success)',
    key: 'pago',
    label: 'Success',
    surface: 'rgba(20,86,58,0.18)',
  },
  {
    border: '#41506a',
    color: '#8ea0bc',
    key: 'concluido',
    label: 'Closed',
    surface: 'rgba(92,109,140,0.18)',
  },
  {
    border: '#4a1f2a',
    color: 'var(--color-danger)',
    key: 'cancelado',
    label: 'Failed',
    surface: 'rgba(113,29,43,0.18)',
  },
]

function formatRatio(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0%'
  }

  return `${Math.round(value * 100)}%`
}

function formatCoverage(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0,0 meses'
  }

  return `${value.toFixed(1).replace('.', ',')} meses`
}

function monthStamp(reference = new Date()) {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`
}

export function DashboardPage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchDashboardSnapshot)
  const [notice, setNotice] = useState<string | null>(null)

  if (isLoading && !data) {
    return <FullScreenLoader label="A carregar o dashboard..." />
  }

  if (error || !data) {
    return (
      <Panel
        actions={
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            Tentar novamente
          </button>
        }
        description={error ?? 'Nao foi possivel carregar o dashboard.'}
        title="Falha ao carregar"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Verifique a ligacao ao Supabase e a politica de acesso das tabelas.
        </p>
      </Panel>
    )
  }

  const { aportes, configuracoes, gastos, projetos, receitas } = data
  const currency = configuracoes.moeda ?? 'CVE'
  const { end, start } = getMonthBounds()
  const receitasDoMes = receitas.filter((item) => isWithinDateRange(item.data, start, end))
  const receitasMes = sumBy(receitasDoMes, (item) => item.valor)
  const gastosMes = sumBy(gastos, (item) => item.valor, (item) => isWithinDateRange(item.data, start, end))
  const investidoMes = sumBy(
    aportes,
    (item) => item.valor,
    (item) => item.tipo === 'aporte' && isWithinDateRange(item.data, start, end),
  )
  const operatingBalance = receitasMes - gastosMes
  const saldoMes = operatingBalance - investidoMes
  const categoriasMes = new Set(
    gastos
      .filter((item) => isWithinDateRange(item.data, start, end))
      .map((item) => item.categoria_nome || 'Sem categoria'),
  ).size
  const alerts = toSortedAlerts(projetos, gastos, configuracoes, currency)
  const groupedIncome = groupByMonth(receitas, (item) => item.data, (item) => item.valor, 6)
  const groupedExpenses = groupByMonth(gastos, (item) => item.data, (item) => item.valor, 6)
  const openProjects = projetos.filter((item) => isOpenProject(item))
  const activeProjects = openProjects.length
  const pendingReceivables = openProjects.reduce(
    (accumulator, project) => accumulator + projectDueAmount(project),
    0,
  )
  const averageTicket = receitasMes > 0 && receitasDoMes.length > 0 ? receitasMes / receitasDoMes.length : 0
  const totalProjectValue = sumBy(projetos, (item) => item.valor_total ?? 0)
  const totalPaidValue = sumBy(projetos, (item) => item.valor_pago ?? 0)
  const collectionRate = totalProjectValue > 0 ? totalPaidValue / totalProjectValue : 0
  const receivableCoverage = gastosMes > 0 ? pendingReceivables / gastosMes : 0
  const trailingIncome = groupedIncome.slice(-3).reduce((accumulator, item) => accumulator + item.total, 0) / 3
  const trailingExpenses = groupedExpenses.slice(-3).reduce((accumulator, item) => accumulator + item.total, 0) / 3
  const nextMonthProjection = trailingIncome - trailingExpenses
  const categoryRows = Object.entries(
    gastos
      .filter((item) => isWithinDateRange(item.data, start, end))
      .reduce<Record<string, number>>((accumulator, item) => {
        const key = item.categoria_nome || 'Sem categoria'
        accumulator[key] = (accumulator[key] ?? 0) + item.valor
        return accumulator
      }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
  const totalCategorias = categoryRows.reduce((accumulator, [, value]) => accumulator + value, 0)
  const upcomingProjects = sortProjectsByDeadline(projetos)
    .filter((item) => item.prazo)
    .slice(0, 6)
  const projectFinanceRows = openProjects
    .map((project) => ({
      clientName: getClientName(project),
      due: projectDueAmount(project),
      paid: project.valor_pago ?? 0,
      percent: formatPercent(project.valor_pago ?? 0, project.valor_total ?? 0),
      project,
      total: project.valor_total ?? 0,
    }))
    .filter((item) => item.total > 0 || item.due > 0)
    .sort((left, right) => {
      const deadlineLeft = left.project.prazo ? new Date(left.project.prazo).getTime() : Number.MAX_SAFE_INTEGER
      const deadlineRight = right.project.prazo ? new Date(right.project.prazo).getTime() : Number.MAX_SAFE_INTEGER

      if (deadlineLeft !== deadlineRight) {
        return deadlineLeft - deadlineRight
      }

      return right.due - left.due
    })
    .slice(0, 5)
  const pendingBills = gastos
    .filter((item) => item.pago === 0)
    .sort((left, right) => new Date(left.data).getTime() - new Date(right.data).getTime())
    .slice(0, 5)

  const statusRows = STATUS_DEFINITIONS.map((definition) => ({
    ...definition,
    count: projetos.filter((project) => (project.status ?? 'pendente').toLowerCase() === definition.key).length,
  }))
  const visibleStatusRows = statusRows.filter((row) => row.count > 0)
  const monthlySummaryRows = groupedIncome.map((incomeRow, index) => {
    const expenseRow = groupedExpenses[index]
    const net = incomeRow.total - expenseRow.total

    return {
      expenses: expenseRow.total,
      income: incomeRow.total,
      label: incomeRow.label,
      margin: incomeRow.total > 0 ? net / incomeRow.total : 0,
      net,
    }
  })

  const excelCards = [
    {
      formula: '(receitas - gastos) / receitas',
      helper: 'Margem operacional do mes corrente.',
      label: 'Margem operacional',
      value: formatRatio(receitasMes > 0 ? operatingBalance / receitasMes : 0),
    },
    {
      formula: 'receitas / lancamentos',
      helper: 'Ticket medio por receita registada neste mes.',
      label: 'Ticket medio',
      value: formatCurrency(averageTicket, currency),
    },
    {
      formula: 'valor pago / valor total',
      helper: 'Percentual ja convertido em caixa na carteira de projetos.',
      label: 'Taxa de cobranca',
      value: formatRatio(collectionRate),
    },
    {
      formula: 'a receber / gastos do mes',
      helper: 'Quanto o pipeline cobre do teu custo mensal.',
      label: 'Cobertura de caixa',
      value: formatCoverage(receivableCoverage),
    },
  ]

  function handleExportSummary() {
    downloadCsv(
      `resumo-dashboard-${monthStamp()}`,
      [
        { label: 'Mes', value: (row) => row.label },
        { label: 'Receitas', value: (row) => row.income.toFixed(2) },
        { label: 'Gastos', value: (row) => row.expenses.toFixed(2) },
        { label: 'Saldo', value: (row) => row.net.toFixed(2) },
        { label: 'Margem', value: (row) => (row.margin * 100).toFixed(2) },
      ],
      monthlySummaryRows,
    )
    setNotice('Resumo mensal exportado para CSV.')
  }

  function handleExportReceitas() {
    downloadCsv(
      `receitas-${monthStamp()}`,
      [
        { label: 'Data', value: (row) => row.data },
        { label: 'Descricao', value: (row) => row.descricao },
        { label: 'Valor', value: (row) => row.valor.toFixed(2) },
        { label: 'Origem', value: (row) => row.origem ?? '' },
        { label: 'Projeto', value: (row) => getRelationItem(row.projetos)?.titulo ?? '' },
      ],
      receitas,
    )
    setNotice('Receitas exportadas para CSV.')
  }

  function handleExportGastos() {
    downloadCsv(
      `gastos-${monthStamp()}`,
      [
        { label: 'Data', value: (row) => row.data },
        { label: 'Descricao', value: (row) => row.descricao },
        { label: 'Categoria', value: (row) => row.categoria_nome ?? '' },
        { label: 'Valor', value: (row) => row.valor.toFixed(2) },
        { label: 'Metodo', value: (row) => row.metodo ?? '' },
        { label: 'Pago', value: (row) => (row.pago === 1 ? 'Sim' : 'Nao') },
      ],
      gastos,
    )
    setNotice('Gastos exportados para CSV.')
  }

  function handleExportPipeline() {
    downloadCsv(
      `pipeline-projetos-${monthStamp()}`,
      [
        { label: 'Cliente', value: (row) => getClientName(row) },
        { label: 'Projeto', value: (row) => row.titulo },
        { label: 'Status', value: (row) => row.status ?? 'pendente' },
        { label: 'Valor total', value: (row) => (row.valor_total ?? 0).toFixed(2) },
        { label: 'Valor pago', value: (row) => (row.valor_pago ?? 0).toFixed(2) },
        { label: 'Em aberto', value: (row) => projectDueAmount(row).toFixed(2) },
        { label: 'Prazo', value: (row) => row.prazo ?? '' },
      ],
      projetos,
    )
    setNotice('Pipeline exportado para CSV.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex items-center gap-3 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#53371a] bg-[rgba(140,96,15,0.18)] text-[var(--color-warning)]">
            <AlertTriangle className="h-4 w-4" />
          </span>
          {alerts.length > 0 ? `${alerts.length} alerta(s) ativo(s)` : 'Nenhum alerta ativo no momento'}
        </div>

        <div className="flex flex-wrap gap-3">
          <button className={BUTTON_SECONDARY} onClick={handleExportSummary} type="button">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar resumo
          </button>
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-[var(--text-primary)]">
          {notice}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {statusRows.map((row) => (
          <div
            key={row.key}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm shadow-[var(--shadow-soft)]"
            style={{
              backgroundColor: row.surface,
              borderColor: row.border,
              color: row.color,
            }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
            <span className="font-medium">{row.label}</span>
            <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-xs text-[var(--text-primary)]">
              {row.count}
            </span>
          </div>
        ))}
      </div>

      {alerts.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-3">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.message}
              className={`rounded-[24px] border px-4 py-4 text-sm ${
                alert.danger
                  ? 'border-[#4a1f2a] bg-[rgba(113,29,43,0.16)] text-[var(--text-primary)]'
                  : 'border-[#5a4722] bg-[rgba(140,96,15,0.16)] text-[var(--text-primary)]'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5">
        <StatCard
          accent="var(--color-success)"
          label="Receitas"
          subtitle={`${receitasDoMes.length} entradas no mes`}
          value={formatCurrency(receitasMes, currency)}
        />
        <StatCard
          accent="var(--color-danger)"
          label="Gastos"
          subtitle={`${categoriasMes} categorias monitoradas`}
          value={formatCurrency(gastosMes, currency)}
        />
        <StatCard
          accent="var(--color-info)"
          label="Saldo"
          subtitle="resultado operacional apos aportes"
          value={formatCurrency(saldoMes, currency)}
        />
        <StatCard
          accent="var(--color-warning)"
          label="A receber"
          subtitle={`${activeProjects} projeto(s) em aberto`}
          value={formatCurrency(pendingReceivables, currency)}
        />
        <StatCard
          accent="#c98fff"
          label="Ticket medio"
          subtitle="media por receita no mes"
          value={formatCurrency(averageTicket, currency)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <Panel
          actions={
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--color-success)]" />
              fluxo 6M
            </div>
          }
          description="Receitas vs gastos dos ultimos seis meses com visualizacao pronta para reunioes ou exportacao."
          title="Performance mensal"
        >
          <ComparisonAreaChart
            data={groupedIncome.map((incomeRow, index) => ({
              label: incomeRow.label,
              primary: incomeRow.total,
              secondary: groupedExpenses[index]?.total ?? 0,
            }))}
            primaryColor="var(--color-info)"
            primaryLabel="Receitas"
            secondaryColor="var(--color-warning)"
            secondaryLabel="Gastos"
          />

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Run-rate</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {formatCurrency(trailingIncome, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Media recente de faturamento.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Burn-rate</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {formatCurrency(trailingExpenses, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Media recente de saida de caixa.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Projecao</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {formatCurrency(nextMonthProjection, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Estimativa liquida do proximo ciclo.</p>
            </div>
          </div>
        </Panel>

        <Panel description="Volume atual da carteira e distribuicao de estados do pipeline." title="Radar do pipeline">
          {visibleStatusRows.length > 0 ? (
            <DonutChart
              centerLabel="Projetos"
              centerValue={String(projetos.length)}
              segments={visibleStatusRows.map((row) => ({
                color: row.color,
                helper: `${row.count} registo(s)`,
                label: row.label,
                value: row.count,
              }))}
            />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Ainda nao ha projetos com status definido.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Panel description="Leituras rapidas com formulas que podes validar no Excel." title="Desk Excel">
          <div className="grid gap-3 md:grid-cols-2">
            {excelCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                  {card.value}
                </p>
                <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">{card.formula}</p>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{card.helper}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <button className={BUTTON_SECONDARY} onClick={handleExportReceitas} type="button">
              <Download className="mr-2 h-4 w-4" />
              Receitas CSV
            </button>
            <button className={BUTTON_SECONDARY} onClick={handleExportGastos} type="button">
              <Download className="mr-2 h-4 w-4" />
              Gastos CSV
            </button>
            <button className={BUTTON_SECONDARY} onClick={handleExportPipeline} type="button">
              <Download className="mr-2 h-4 w-4" />
              Pipeline CSV
            </button>
          </div>
        </Panel>

        <Panel description="Categorias com maior peso no gasto do mes atual." title="Gastos por categoria">
          {categoryRows.length > 0 ? (
            <div className="space-y-5">
              <MiniBarChart
                data={categoryRows.map(([label, value], index) => ({
                  color:
                    [
                      'linear-gradient(180deg,rgba(108,156,255,0.96),rgba(42,88,194,0.58))',
                      'linear-gradient(180deg,rgba(72,224,174,0.96),rgba(28,138,98,0.58))',
                      'linear-gradient(180deg,rgba(255,184,77,0.96),rgba(168,107,13,0.58))',
                      'linear-gradient(180deg,rgba(201,143,255,0.96),rgba(118,72,194,0.58))',
                    ][index % 4],
                  label,
                  value,
                }))}
              />

              <div className="space-y-3">
                {categoryRows.map(([name, value]) => (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-primary)]">{name}</span>
                      <span className="font-mono text-xs text-[var(--text-secondary)]">
                        {formatCurrency(value, currency)} · {formatRatio(value / totalCategorias)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-strong))]"
                        style={{ width: `${Math.max((value / totalCategorias) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Nenhum gasto registado no mes atual.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Panel
          description="Projetos ativos com leitura do valor pago e do que ainda falta receber."
          title="Pipeline financeiro"
        >
          <div className="space-y-4">
            {projectFinanceRows.length > 0 ? (
              projectFinanceRows.map(({ clientName, due, paid, percent, project, total }) => {
                const progressValue = total > 0 ? Math.min((paid / total) * 100, 100) : 0

                return (
                  <div key={project.id} className="rounded-[26px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{project.titulo}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {clientName} · prazo {formatDate(project.prazo)}
                        </p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-strong))]"
                        style={{ width: `${Math.max(progressValue, progressValue > 0 ? 8 : 0)}%` }}
                      />
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-[var(--text-secondary)] md:grid-cols-3">
                      <p>
                        Total: <span className="font-mono text-[var(--text-primary)]">{formatCurrency(total, currency)}</span>
                      </p>
                      <p>
                        Pago: <span className="font-mono text-[var(--color-success)]">{formatCurrency(paid, currency)}</span>
                      </p>
                      <p>
                        Em aberto: <span className="font-mono text-[var(--color-warning)]">{formatCurrency(due, currency)}</span>
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">{percent} recebido</p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Ainda nao ha projetos ativos com valor definido.</p>
            )}
          </div>
        </Panel>

        <Panel description="Contas ainda nao pagas, ordenadas pela data mais urgente." title="Contas a pagar">
          <div className="space-y-3">
            {pendingBills.length > 0 ? (
              pendingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{bill.descricao}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {bill.categoria_nome || 'Sem categoria'} · {formatDate(bill.data)}
                      </p>
                    </div>
                    <span className="font-mono text-xs" style={{ color: deadlineColor(bill.data) }}>
                      {formatCurrency(bill.valor, currency)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Nao existem contas pendentes na base atual.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Panel description="Tabela mensal pronta para conferencia rapida ou reconciliacao no Excel." title="Resumo mensal">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  <th className="pb-2 pr-4 font-medium">Mes</th>
                  <th className="pb-2 pr-4 font-medium">Receitas</th>
                  <th className="pb-2 pr-4 font-medium">Gastos</th>
                  <th className="pb-2 pr-4 font-medium">Saldo</th>
                  <th className="pb-2 font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaryRows.map((row) => (
                  <tr key={row.label} className="text-sm">
                    <td className="rounded-l-[22px] border-y border-l border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-primary)]">
                      {row.label}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--color-success)]">
                      {formatCurrency(row.income, currency)}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--color-warning)]">
                      {formatCurrency(row.expenses, currency)}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-primary)]">
                      {formatCurrency(row.net, currency)}
                    </td>
                    <td className="rounded-r-[22px] border-y border-r border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-secondary)]">
                      {formatRatio(row.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel description="Projetos com prazo definido, ordenados por urgencia." title="Proximos prazos">
          {upcomingProjects.length > 0 ? (
            <div className="space-y-3">
              {upcomingProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{project.titulo}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{getClientName(project)}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">
                      {formatCurrency(project.valor_total ?? 0, currency)}
                    </span>
                    <span style={{ color: deadlineColor(project.prazo) }}>{formatDate(project.prazo)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Ainda nao ha projetos com prazo cadastrado.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}

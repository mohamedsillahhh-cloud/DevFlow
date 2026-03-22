import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { FullScreenLoader } from '../components/full-screen-loader'
import { Panel } from '../components/panel'
import { StatCard } from '../components/stat-card'
import { StatusBadge } from '../components/status-badge'
import { useAsyncData } from '../hooks/use-async-data'
import {
  BUTTON_SECONDARY,
  deadlineColor,
  formatCurrency,
  formatDate,
  formatPercent,
  getClientName,
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

export function DashboardPage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchDashboardSnapshot)

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
        <p className="text-sm text-[#888888]">
          Verifique a ligacao ao Supabase e a politica de acesso das tabelas.
        </p>
      </Panel>
    )
  }

  const { aportes, configuracoes, gastos, investimentos, projetos, receitas } = data
  const currency = configuracoes.moeda ?? 'CVE'
  const { end, start } = getMonthBounds()
  const receitasMes = sumBy(receitas, (item) => item.valor, (item) => isWithinDateRange(item.data, start, end))
  const gastosMes = sumBy(gastos, (item) => item.valor, (item) => isWithinDateRange(item.data, start, end))
  const investidoMes = sumBy(
    aportes,
    (item) => item.valor,
    (item) => item.tipo === 'aporte' && isWithinDateRange(item.data, start, end),
  )
  const saldoMes = receitasMes - gastosMes - investidoMes
  const categoriasMes = new Set(
    gastos
      .filter((item) => isWithinDateRange(item.data, start, end))
      .map((item) => item.categoria_nome || 'Sem categoria'),
  ).size
  const alerts = toSortedAlerts(projetos, gastos, configuracoes, currency)
  const groupedIncome = groupByMonth(receitas, (item) => item.data, (item) => item.valor, 6)
  const groupedExpenses = groupByMonth(gastos, (item) => item.data, (item) => item.valor, 6)
  const highestMonth = Math.max(
    1,
    ...groupedIncome.map((item) => item.total),
    ...groupedExpenses.map((item) => item.total),
  )
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
    .slice(0, 8)
  const totalCategorias = categoryRows.reduce((accumulator, [, value]) => accumulator + value, 0)
  const upcomingProjects = sortProjectsByDeadline(projetos)
    .filter((item) => item.prazo)
    .slice(0, 8)
  const projectFinanceRows = projetos
    .filter((item) => isOpenProject(item))
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
    .slice(0, 6)
  const pendingBills = gastos
    .filter((item) => item.pago === 0)
    .sort((left, right) => new Date(left.data).getTime() - new Date(right.data).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 rounded-2xl border border-[#1a1a1a] bg-[#090909] px-4 py-3 text-sm text-[#888888]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#251116] bg-[#14080b] text-[#e94560]">
            <AlertTriangle className="h-4 w-4" />
          </span>
          {alerts.length > 0 ? `${alerts.length} alerta(s) ativo(s)` : 'Nenhum alerta ativo no momento'}
        </div>

        <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </button>
      </div>

      {alerts.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-3">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.message}
              className={`rounded-2xl border px-4 py-4 text-sm ${
                alert.danger
                  ? 'border-[#3d0000] bg-[#0a0000] text-[#f0f0f0]'
                  : 'border-[#3d2800] bg-[#0a0500] text-[#f0f0f0]'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          accent="#1d9e75"
          label="Receitas"
          subtitle={`${projetos.length} projetos cadastrados`}
          value={formatCurrency(receitasMes, currency)}
        />
        <StatCard
          accent="#e24b4a"
          label="Gastos"
          subtitle={`${categoriasMes} categorias no mes`}
          value={formatCurrency(gastosMes, currency)}
        />
        <StatCard
          accent="#378add"
          label="Investido"
          subtitle={`${investimentos.filter((item) => item.ativo === 1).length} ativos`}
          value={formatCurrency(investidoMes, currency)}
        />
        <StatCard
          accent={saldoMes >= 0 ? '#1d9e75' : '#e24b4a'}
          label="Saldo liquido"
          subtitle="apos aportes"
          value={formatCurrency(saldoMes, currency)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
        <Panel description="Receitas vs gastos dos ultimos seis meses." title="Performance mensal">
          <div className="space-y-4">
            {groupedIncome.map((incomeRow, index) => {
              const expenseRow = groupedExpenses[index]
              return (
                <div key={incomeRow.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[#888888]">
                    <span className="capitalize">{incomeRow.label}</span>
                    <span className="font-mono text-xs text-[#666666]">
                      {formatCurrency(incomeRow.total, currency)} / {formatCurrency(expenseRow.total, currency)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
                      <div
                        className="h-full rounded-full bg-[#1d9e75]"
                        style={{ width: `${Math.min((incomeRow.total / highestMonth) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
                      <div
                        className="h-full rounded-full bg-[#e24b4a]"
                        style={{ width: `${Math.min((expenseRow.total / highestMonth) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel description="Distribuicao do gasto do mes atual." title="Gastos por categoria">
          <div className="space-y-4">
            {categoryRows.length > 0 ? (
              categoryRows.map(([name, value]) => (
                <div key={name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#f0f0f0]">{name}</span>
                    <span className="font-mono text-xs text-[#888888]">{formatCurrency(value, currency)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
                    <div
                      className="h-full rounded-full bg-[#e94560]"
                      style={{ width: `${Math.max((value / totalCategorias) * 100, 6)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#888888]">Nenhum gasto registado no mes atual.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Panel
          description="Progresso financeiro dos projetos ativos com leitura do valor pago e do que ainda falta receber."
          title="Pipeline financeiro"
        >
          <div className="space-y-4">
            {projectFinanceRows.length > 0 ? (
              projectFinanceRows.map(({ clientName, due, paid, percent, project, total }) => {
                const progressValue = total > 0 ? Math.min((paid / total) * 100, 100) : 0

                return (
                  <div key={project.id} className="rounded-2xl border border-[#171717] bg-[#090909] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#f0f0f0]">{project.titulo}</p>
                        <p className="mt-1 text-xs text-[#666666]">
                          {clientName} · prazo {formatDate(project.prazo)}
                        </p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#141414]">
                      <div
                        className="h-full rounded-full bg-[#378add]"
                        style={{ width: `${Math.max(progressValue, progressValue > 0 ? 8 : 0)}%` }}
                      />
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-[#888888] md:grid-cols-3">
                      <p>Total: <span className="font-mono text-[#f0f0f0]">{formatCurrency(total, currency)}</span></p>
                      <p>Pago: <span className="font-mono text-[#1d9e75]">{formatCurrency(paid, currency)}</span></p>
                      <p>Em aberto: <span className="font-mono text-[#ef9f27]">{formatCurrency(due, currency)}</span></p>
                    </div>
                    <p className="mt-2 text-xs text-[#666666]">{percent} recebido</p>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[#888888]">Ainda nao ha projetos ativos com valor definido.</p>
            )}
          </div>
        </Panel>

        <Panel
          description="Contas ainda nao pagas, ordenadas pela data mais urgente."
          title="Contas a pagar"
        >
          <div className="space-y-3">
            {pendingBills.length > 0 ? (
              pendingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-2xl border border-[#171717] bg-[#090909] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f0]">{bill.descricao}</p>
                      <p className="mt-1 text-xs text-[#666666]">
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
              <p className="text-sm text-[#888888]">Nao existem contas pendentes na base atual.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel description="Projetos com prazo definido, ordenados por urgencia." title="Proximos prazos">
        {upcomingProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">
                  <th className="pb-2 pr-4 font-medium">Cliente</th>
                  <th className="pb-2 pr-4 font-medium">Projeto</th>
                  <th className="pb-2 pr-4 font-medium">Valor</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {upcomingProjects.map((project) => (
                  <tr key={project.id} className="rounded-2xl bg-[#090909] text-sm">
                    <td className="rounded-l-2xl border-y border-l border-[#171717] px-4 py-3 text-[#888888]">
                      {getClientName(project)}
                    </td>
                    <td className="border-y border-[#171717] px-4 py-3 text-[#f0f0f0]">{project.titulo}</td>
                    <td className="border-y border-[#171717] px-4 py-3 text-[#888888]">
                      {formatCurrency(project.valor_total ?? 0, currency)}
                    </td>
                    <td className="border-y border-[#171717] px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="rounded-r-2xl border-y border-r border-[#171717] px-4 py-3">
                      <span style={{ color: deadlineColor(project.prazo) }}>{formatDate(project.prazo)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[#888888]">Ainda nao ha projetos com prazo cadastrado.</p>
        )}
      </Panel>
    </div>
  )
}

import { AlertTriangle, Download, FileSpreadsheet, PlusCircle, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { ComparisonAreaChart, DonutChart, MiniBarChart } from '../components/data-viz'
import { FullScreenLoader } from '../components/full-screen-loader'
import { Panel } from '../components/panel'
import { StatCard } from '../components/stat-card'
import { useAsyncData } from '../hooks/use-async-data'
import { useRealtimeSync } from '../hooks/use-realtime-sync'
import { downloadCsv } from '../lib/csv'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  INPUT_BASE,
  formatCurrency,
  formatDate,
  formatInputDateValue,
  formatMonthLabel,
  getMonthBounds,
  getRelationItem,
  isOpenProject,
  isWithinDateRange,
  parseDateValue,
  projectDueAmount,
  shiftMonth,
  sumBy,
} from '../lib/format'
import {
  createGasto,
  createReceita,
  deleteGasto,
  deleteReceita,
  fetchFinanceSnapshot,
} from '../lib/supabase-data'
import type { Gasto, Receita } from '../lib/types'

const TEXTAREA_BASE = `${INPUT_BASE} min-h-[110px] resize-y`
const CUSTOM_CATEGORY_VALUE = '__custom__'
const DEFAULT_EXPENSE_CATEGORIES = [
  'Operacao',
  'Marketing',
  'Impostos',
  'Software',
  'Ferramentas',
  'Equipa',
  'Educacao',
  'Infraestrutura',
  'Transporte',
  'Servicos',
]
const CHART_GRADIENTS = [
  'linear-gradient(180deg,rgba(108,156,255,0.96),rgba(42,88,194,0.58))',
  'linear-gradient(180deg,rgba(72,224,174,0.96),rgba(28,138,98,0.58))',
  'linear-gradient(180deg,rgba(255,184,77,0.96),rgba(168,107,13,0.58))',
  'linear-gradient(180deg,rgba(201,143,255,0.96),rgba(118,72,194,0.58))',
  'linear-gradient(180deg,rgba(255,119,146,0.96),rgba(173,57,83,0.58))',
  'linear-gradient(180deg,rgba(122,240,255,0.96),rgba(29,131,147,0.58))',
]
const SOLID_COLORS = ['#6c9cff', '#48e0ae', '#ffb84d', '#c98fff', '#ff7792', '#7af0ff']
const MONTH_PICKER_FORMATTER = new Intl.DateTimeFormat('pt-PT', { month: 'short' })
const MONTH_NAME_FORMATTER = new Intl.DateTimeFormat('pt-PT', { month: 'long' })

function monthStamp(reference: Date) {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`
}

function getMonthChipLabel(monthIndex: number) {
  return MONTH_PICKER_FORMATTER.format(new Date(2026, monthIndex, 1)).replace('.', '')
}

function getMonthName(monthIndex: number) {
  return MONTH_NAME_FORMATTER.format(new Date(2026, monthIndex, 1))
}

function formatRatio(value: number) {
  if (!Number.isFinite(value)) {
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

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function matchesSearch(query: string, ...values: Array<string | number | null | undefined>) {
  const normalizedQuery = normalizeText(query.trim())
  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => normalizeText(String(value ?? '')).includes(normalizedQuery))
}

function buildMonthlySeries<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
  getValue: (item: T) => number,
  endReference: Date,
  months = 6,
) {
  return Array.from({ length: months }).map((_, index) => {
    const reference = shiftMonth(
      new Date(endReference.getFullYear(), endReference.getMonth(), 1),
      -(months - index - 1),
    )
    const { end, start } = getMonthBounds(reference)

    return {
      label: formatMonthLabel(reference),
      total: sumBy(items, getValue, (item) => isWithinDateRange(getDate(item), start, end)),
    }
  })
}

function getRecurringDueDate(item: Gasto, reference: Date) {
  const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate()
  const baseDay = parseDateValue(item.data).getDate() || 1
  const dueDay = Math.min(item.dia_vencimento ?? baseDay, daysInMonth)
  return new Date(reference.getFullYear(), reference.getMonth(), dueDay)
}

function getDueStatusLabel(target: Date, currentMonthView: boolean) {
  if (!currentMonthView) {
    return formatDate(target)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(target)
  dueDate.setHours(0, 0, 0, 0)

  const diff = Math.floor((dueDate.getTime() - today.getTime()) / 86400000)
  if (diff < 0) {
    return `Atrasado ${Math.abs(diff)}d`
  }
  if (diff === 0) {
    return 'Vence hoje'
  }
  if (diff === 1) {
    return 'Vence amanha'
  }
  return `Vence em ${diff}d`
}

function getExpenseCategoryLabel(item: Gasto) {
  return item.categoria_nome?.trim() || 'Sem categoria'
}

function getIncomeSourceLabel(item: Receita) {
  const projectTitle = getRelationItem(item.projetos)?.titulo
  if (projectTitle) {
    return `Projeto: ${projectTitle}`
  }

  return item.origem?.trim() || 'Sem origem'
}

export function FinancePage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchFinanceSnapshot)
  const { isLive } = useRealtimeSync(['configuracoes', 'gastos', 'projetos', 'receitas'], reload, {
    pollIntervalMs: 12000,
  })
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('all')
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    customCategory: '',
    date: formatInputDateValue(),
    description: '',
    dueDay: '',
    method: '',
    notes: '',
    paid: true,
    recurring: false,
    value: '',
  })
  const [incomeForm, setIncomeForm] = useState({
    date: formatInputDateValue(),
    description: '',
    projectId: '',
    source: '',
    value: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [submittingForm, setSubmittingForm] = useState<'expense' | 'income' | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null)
  const [deletingIncomeId, setDeletingIncomeId] = useState<number | null>(null)
  const deferredSearchQuery = useDeferredValue(searchQuery)

  if (isLoading && !data) {
    return <FullScreenLoader label="A carregar as financas..." />
  }

  if (error || !data) {
    return (
      <Panel
        actions={
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            Tentar novamente
          </button>
        }
        description={error ?? 'Nao foi possivel carregar as financas.'}
        title="Falha ao carregar"
      />
    )
  }

  const { configuracoes, gastos, projetos, receitas } = data
  const today = new Date()
  const reference = new Date(selectedYear, selectedMonth, 1)
  const currentMonthView = selectedYear === today.getFullYear() && selectedMonth === today.getMonth()
  const currency = configuracoes.moeda ?? 'CVE'
  const monthLabel = formatMonthLabel(reference)
  const datedYears = [...gastos, ...receitas]
    .map((item) => parseDateValue(item.data).getFullYear())
    .filter((value) => Number.isFinite(value))
  const minYear = datedYears.length > 0 ? Math.min(...datedYears, today.getFullYear() - 2) : today.getFullYear() - 2
  const maxYear = datedYears.length > 0 ? Math.max(...datedYears, today.getFullYear() + 2) : today.getFullYear() + 2
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index)
  const monthOptions = Array.from({ length: 12 }, (_, month) => ({
    label: getMonthChipLabel(month),
    value: month,
  }))
  const { end, start } = getMonthBounds(reference)
  const gastosMes = gastos.filter((item) => isWithinDateRange(item.data, start, end))
  const receitasMes = receitas.filter((item) => isWithinDateRange(item.data, start, end))
  const gastosTotal = sumBy(gastosMes, (item) => item.valor)
  const receitasTotal = sumBy(receitasMes, (item) => item.valor)
  const saldo = receitasTotal - gastosTotal
  const pendentes = gastosMes.filter((item) => item.pago === 0)
  const pendenteValor = sumBy(pendentes, (item) => item.valor)
  const recorrentes = gastos.filter((item) => item.recorrente === 1)
  const recurringCommitment = sumBy(recorrentes, (item) => item.valor)
  const linkedProjectIncome = sumBy(receitasMes, (item) => item.valor, (item) => Boolean(getRelationItem(item.projetos)))
  const averageExpense = gastosMes.length > 0 ? gastosTotal / gastosMes.length : 0
  const averageIncome = receitasMes.length > 0 ? receitasTotal / receitasMes.length : 0
  const largestExpense = [...gastosMes].sort((left, right) => right.valor - left.valor)[0] ?? null
  const pendingReceivables = sumBy(projetos.filter((item) => isOpenProject(item)), projectDueAmount)
  const expenseCoverage = averageExpense > 0 ? pendingReceivables / averageExpense : 0
  const cashMargin = receitasTotal > 0 ? saldo / receitasTotal : 0
  const expenseCategoryOptions = Array.from(
    new Set([
      ...DEFAULT_EXPENSE_CATEGORIES,
      ...gastos
        .map((item) => item.categoria_nome?.trim())
        .filter((item): item is string => Boolean(item)),
    ]),
  ).sort((left, right) => left.localeCompare(right, 'pt-PT'))
  const expenseFilterOptions = Array.from(new Set(['Sem categoria', ...expenseCategoryOptions]))

  const incomeSeries = buildMonthlySeries(receitas, (item) => item.data, (item) => item.valor, reference, 6)
  const expenseSeries = buildMonthlySeries(gastos, (item) => item.data, (item) => item.valor, reference, 6)
  const annualSummaryRows = monthOptions.map((option) => {
    const monthReference = new Date(selectedYear, option.value, 1)
    const { end: monthEnd, start: monthStart } = getMonthBounds(monthReference)
    const income = sumBy(receitas, (item) => item.valor, (item) => isWithinDateRange(item.data, monthStart, monthEnd))
    const expenses = sumBy(gastos, (item) => item.valor, (item) => isWithinDateRange(item.data, monthStart, monthEnd))
    const net = income - expenses
    const activity = income + expenses

    return {
      activity,
      expenses,
      income,
      isActive: option.value === selectedMonth,
      label: getMonthName(option.value),
      margin: income > 0 ? net / income : 0,
      month: option.value,
      monthChip: option.label.toUpperCase(),
      monthLabel: formatMonthLabel(monthReference),
      net,
    }
  })
  const trailingIncome = incomeSeries.slice(-3).reduce((accumulator, item) => accumulator + item.total, 0) / 3
  const trailingExpenses = expenseSeries.slice(-3).reduce((accumulator, item) => accumulator + item.total, 0) / 3
  const projectedNet = trailingIncome - trailingExpenses
  const yearToDateRows = annualSummaryRows.slice(0, selectedMonth + 1)
  const annualIncome = annualSummaryRows.reduce((accumulator, item) => accumulator + item.income, 0)
  const annualExpenses = annualSummaryRows.reduce((accumulator, item) => accumulator + item.expenses, 0)
  const yearToDateIncome = yearToDateRows.reduce((accumulator, item) => accumulator + item.income, 0)
  const yearToDateExpenses = yearToDateRows.reduce((accumulator, item) => accumulator + item.expenses, 0)
  const yearToDateNet = yearToDateIncome - yearToDateExpenses
  const annualActivityMax = Math.max(1, ...annualSummaryRows.map((row) => row.activity))
  const bestMonth = [...annualSummaryRows].sort((left, right) => right.net - left.net)[0] ?? annualSummaryRows[0]
  const mostActiveMonth =
    [...annualSummaryRows].sort((left, right) => right.activity - left.activity)[0] ?? annualSummaryRows[0]

  const expenseCategoryRows = Object.entries(
    gastosMes.reduce<Record<string, number>>((accumulator, item) => {
      const key = getExpenseCategoryLabel(item)
      accumulator[key] = (accumulator[key] ?? 0) + item.valor
      return accumulator
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
  const totalCategoryAmount = expenseCategoryRows.reduce((accumulator, [, value]) => accumulator + value, 0)

  const incomeSourceRows = Object.entries(
    receitasMes.reduce<Record<string, number>>((accumulator, item) => {
      const key = getIncomeSourceLabel(item)
      accumulator[key] = (accumulator[key] ?? 0) + item.valor
      return accumulator
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
  const totalIncomeSources = incomeSourceRows.reduce((accumulator, [, value]) => accumulator + value, 0)

  const paymentMethodRows = Object.entries(
    gastosMes.reduce<Record<string, number>>((accumulator, item) => {
      const key = item.metodo?.trim() || 'Sem metodo'
      accumulator[key] = (accumulator[key] ?? 0) + item.valor
      return accumulator
    }, {}),
  ).sort((left, right) => right[1] - left[1])
  const totalPaymentMethods = paymentMethodRows.reduce((accumulator, [, value]) => accumulator + value, 0)

  const pendingBills = gastos
    .filter((item) => item.pago === 0)
    .sort((left, right) => parseDateValue(left.data).getTime() - parseDateValue(right.data).getTime())
    .slice(0, 5)
  const recurringRows = recorrentes
    .map((item) => ({
      ...item,
      dueDate: getRecurringDueDate(item, reference),
    }))
    .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())
    .slice(0, 6)

  const visibleExpenses = gastosMes.filter((item) => {
    const categoryLabel = getExpenseCategoryLabel(item)
    const matchesCategory = categoryFilter === 'all' || categoryLabel === categoryFilter
    const matchesStatus =
      expenseStatusFilter === 'all' ||
      (expenseStatusFilter === 'paid' && item.pago === 1) ||
      (expenseStatusFilter === 'pending' && item.pago === 0)

    return (
      matchesCategory &&
      matchesStatus &&
      matchesSearch(deferredSearchQuery, item.descricao, categoryLabel, item.metodo, item.notas)
    )
  })
  const visibleIncome = receitasMes.filter((item) =>
    matchesSearch(
      deferredSearchQuery,
      item.descricao,
      item.origem,
      getRelationItem(item.projetos)?.titulo,
      getIncomeSourceLabel(item),
    ),
  )

  function handleExportSummary() {
    downloadCsv(
      `resumo-financas-${selectedYear}`,
      [
        { label: 'Mes', value: (row) => row.label },
        { label: 'Receitas', value: (row) => row.income.toFixed(2) },
        { label: 'Gastos', value: (row) => row.expenses.toFixed(2) },
        { label: 'Saldo', value: (row) => row.net.toFixed(2) },
        { label: 'Margem', value: (row) => (row.margin * 100).toFixed(2) },
      ],
      annualSummaryRows,
    )
    setFeedback(`Resumo anual de ${selectedYear} exportado com sucesso.`)
    setActionError(null)
  }

  function handleExportExpenses() {
    downloadCsv(
      `gastos-${monthStamp(reference)}`,
      [
        { label: 'Data', value: (row) => row.data },
        { label: 'Descricao', value: (row) => row.descricao },
        { label: 'Categoria', value: (row) => getExpenseCategoryLabel(row) },
        { label: 'Valor', value: (row) => row.valor.toFixed(2) },
        { label: 'Metodo', value: (row) => row.metodo ?? '' },
        { label: 'Pago', value: (row) => (row.pago === 1 ? 'Sim' : 'Nao') },
      ],
      visibleExpenses,
    )
    setFeedback('CSV de gastos exportado com os filtros atuais.')
    setActionError(null)
  }

  function handleExportIncome() {
    downloadCsv(
      `receitas-${monthStamp(reference)}`,
      [
        { label: 'Data', value: (row) => row.data },
        { label: 'Descricao', value: (row) => row.descricao },
        { label: 'Valor', value: (row) => row.valor.toFixed(2) },
        { label: 'Origem', value: (row) => row.origem ?? '' },
        { label: 'Projeto', value: (row) => getRelationItem(row.projetos)?.titulo ?? '' },
      ],
      visibleIncome,
    )
    setFeedback('CSV de receitas exportado com os filtros atuais.')
    setActionError(null)
  }

  async function handleCreateExpense() {
    setFeedback(null)
    setActionError(null)
    setSubmittingForm('expense')

    try {
      const category =
        expenseForm.category === CUSTOM_CATEGORY_VALUE
          ? expenseForm.customCategory.trim()
          : expenseForm.category

      if (expenseForm.category === CUSTOM_CATEGORY_VALUE && !category) {
        throw new Error('Informe a categoria personalizada do gasto.')
      }

      await createGasto({
        category,
        date: expenseForm.date,
        description: expenseForm.description,
        dueDay: expenseForm.recurring && expenseForm.dueDay ? Number(expenseForm.dueDay) : null,
        method: expenseForm.method,
        notes: expenseForm.notes,
        paid: expenseForm.paid,
        recurring: expenseForm.recurring,
        value: expenseForm.value ? Number(expenseForm.value) : 0,
      })

      const createdExpenseDate = parseDateValue(expenseForm.date)
      if (Number.isFinite(createdExpenseDate.getTime())) {
        setSelectedYear(createdExpenseDate.getFullYear())
        setSelectedMonth(createdExpenseDate.getMonth())
      }

      setExpenseForm({
        category: '',
        customCategory: '',
        date: formatInputDateValue(),
        description: '',
        dueDay: '',
        method: '',
        notes: '',
        paid: true,
        recurring: false,
        value: '',
      })
      setFeedback('Gasto registado com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel registar o gasto.')
    } finally {
      setSubmittingForm(null)
    }
  }

  async function handleCreateIncome() {
    setFeedback(null)
    setActionError(null)
    setSubmittingForm('income')

    try {
      await createReceita({
        date: incomeForm.date,
        description: incomeForm.description,
        projectId: incomeForm.projectId ? Number(incomeForm.projectId) : null,
        source: incomeForm.source,
        value: incomeForm.value ? Number(incomeForm.value) : 0,
      })

      const createdIncomeDate = parseDateValue(incomeForm.date)
      if (Number.isFinite(createdIncomeDate.getTime())) {
        setSelectedYear(createdIncomeDate.getFullYear())
        setSelectedMonth(createdIncomeDate.getMonth())
      }

      setIncomeForm({
        date: formatInputDateValue(),
        description: '',
        projectId: '',
        source: '',
        value: '',
      })
      setFeedback('Receita registada com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel registar a receita.')
    } finally {
      setSubmittingForm(null)
    }
  }

  async function handleDeleteExpense(expenseId: number, description: string) {
    const shouldDelete = window.confirm(`Remover o gasto "${description}"?`)
    if (!shouldDelete) {
      return
    }

    setFeedback(null)
    setActionError(null)
    setDeletingExpenseId(expenseId)

    try {
      await deleteGasto(expenseId)
      setFeedback('Gasto removido com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel remover o gasto.')
    } finally {
      setDeletingExpenseId(null)
    }
  }

  async function handleDeleteIncome(receiptId: number, description: string) {
    const shouldDelete = window.confirm(`Remover a receita "${description}"?`)
    if (!shouldDelete) {
      return
    }

    setFeedback(null)
    setActionError(null)
    setDeletingIncomeId(receiptId)

    try {
      await deleteReceita(receiptId)
      setFeedback('Receita removida com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel remover a receita.')
    } finally {
      setDeletingIncomeId(null)
    }
  }

  return (
    <div className="space-y-6">
      {(feedback || actionError) && (
        <div className="grid gap-3 xl:grid-cols-2">
          {feedback ? (
            <div className="rounded-[24px] border border-[#1f4a39] bg-[rgba(20,86,58,0.16)] px-4 py-3 text-sm text-[var(--text-primary)]">
              {feedback}
            </div>
          ) : null}
          {actionError ? (
            <div className="rounded-[24px] border border-[#4a1f2a] bg-[rgba(113,29,43,0.16)] px-4 py-3 text-sm text-[var(--text-primary)]">
              {actionError}
            </div>
          ) : null}
        </div>
      )}

      <div className="grid gap-6 2xl:grid-cols-[1.15fr,0.85fr]">
        <Panel
          actions={
            <div
              className={[
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.24em]',
                isLive
                  ? 'border-[#143d31] bg-[rgba(20,86,58,0.18)] text-[#7ef7c8]'
                  : 'border-[#5a4722] bg-[rgba(140,96,15,0.16)] text-[var(--color-warning)]',
              ].join(' ')}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-[#2effa8]' : 'bg-[var(--color-warning)]'}`} />
              {isLive ? 'tempo real' : 'sync ativa'}
            </div>
          }
          description="Escolhe primeiro o ano e depois qualquer um dos 12 meses para focar os dados do periodo."
          title="Periodo"
        >
          <div className="grid gap-5 xl:grid-cols-[220px,minmax(0,1fr)]">
            <label className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Ano</span>
              <select
                className={`${INPUT_BASE} text-lg font-semibold tracking-[-0.04em]`}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                value={selectedYear}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Mes ativo</p>
                  <h3 className="mt-2 text-[clamp(1.9rem,3vw,2.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-primary)]">
                    {monthLabel}
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
                  leitura mensal
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                {monthOptions.map((option) => {
                  const isActive = option.value === selectedMonth

                  return (
                    <button
                      key={option.value}
                      className={[
                        'rounded-[22px] border px-4 py-3 text-left transition',
                        isActive
                          ? 'border-[rgba(255,255,255,0.22)] bg-[linear-gradient(180deg,rgba(22,22,22,0.98),rgba(8,8,8,0.98))] text-[var(--text-primary)] shadow-[0_16px_40px_rgba(255,255,255,0.04)]'
                          : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                      ].join(' ')}
                      onClick={() => setSelectedMonth(option.value)}
                      type="button"
                    >
                      <span className="block text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Mes</span>
                      <span className="mt-2 block text-sm font-medium capitalize">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          description="Pesquisa rapida, filtros compactos e exportacao do periodo sem sobrecarregar a tela."
          title="Filtros"
        >
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Pesquisar</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  className={`${INPUT_BASE} pl-11`}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Descricao, origem, categoria ou metodo"
                  type="text"
                  value={searchQuery}
                />
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Categoria</span>
                <select
                  className={INPUT_BASE}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  value={categoryFilter}
                >
                  <option value="all">Todas</option>
                  {expenseFilterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Estado do gasto</span>
                <select
                  className={INPUT_BASE}
                  onChange={(event) => setExpenseStatusFilter(event.target.value)}
                  value={expenseStatusFilter}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="paid">Pagos</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className={BUTTON_SECONDARY} onClick={handleExportSummary} type="button">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Resumo CSV
              </button>
              <button className={BUTTON_SECONDARY} onClick={handleExportExpenses} type="button">
                <Download className="mr-2 h-4 w-4" />
                Gastos CSV
              </button>
              <button className={BUTTON_SECONDARY} onClick={handleExportIncome} type="button">
                <Download className="mr-2 h-4 w-4" />
                Receitas CSV
              </button>
              <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Atualizar
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <StatCard
          accent="#1d9e75"
          label="Receitas do periodo"
          subtitle={`${receitasMes.length} entrada(s) em ${monthLabel}`}
          value={formatCurrency(receitasTotal, currency)}
        />
        <StatCard
          accent="#e24b4a"
          label="Gastos do periodo"
          subtitle={`${gastosMes.length} saida(s) registadas`}
          value={formatCurrency(gastosTotal, currency)}
        />
        <StatCard
          accent={saldo >= 0 ? '#1d9e75' : '#e24b4a'}
          label="Saldo operacional"
          subtitle={`${formatRatio(cashMargin)} de margem no periodo`}
          value={formatCurrency(saldo, currency)}
        />
        <StatCard
          accent="#ef9f27"
          label="Pendencias"
          subtitle={`${pendentes.length} conta(s) em aberto`}
          value={formatCurrency(pendenteValor, currency)}
        />
        <StatCard
          accent="#6c9cff"
          label="A receber"
          subtitle={`${formatCoverage(expenseCoverage)} de cobertura media`}
          value={formatCurrency(pendingReceivables, currency)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
        <Panel
          actions={
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
              6M ate {monthStamp(reference)}
            </div>
          }
          description="Receitas e gastos dos ultimos seis meses encerrando no periodo selecionado."
          title="Radar financeiro"
        >
          <ComparisonAreaChart
            data={incomeSeries.map((incomeRow, index) => ({
              label: incomeRow.label,
              primary: incomeRow.total,
              secondary: expenseSeries[index]?.total ?? 0,
            }))}
            formatValue={(value) => formatCurrency(value, currency)}
            primaryColor="var(--color-success)"
            primaryLabel="Receitas"
            secondaryColor="var(--color-danger)"
            secondaryLabel="Gastos"
          />

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Run-rate</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {formatCurrency(trailingIncome, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Media de entradas dos ultimos tres ciclos.</p>
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
                {formatCurrency(projectedNet, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Saldo estimado do proximo ciclo medio.</p>
            </div>
          </div>
        </Panel>

        <Panel description="Leituras rapidas para decidir sem sair da operacao financeira." title="Desk do periodo">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Receita ligada a projeto</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {formatCurrency(linkedProjectIncome, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {formatRatio(receitasTotal > 0 ? linkedProjectIncome / receitasTotal : 0)} do caixa do periodo.
              </p>
            </article>

            <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Compromisso recorrente</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {formatCurrency(recurringCommitment, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {recorrentes.length} despesa(s) recorrente(s) catalogada(s).
              </p>
            </article>

            <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Ticket medio</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {formatCurrency(averageIncome, currency)}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Gasto medio: {formatCurrency(averageExpense, currency)}.
              </p>
            </article>

            <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Maior gasto</p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                {largestExpense ? largestExpense.descricao : 'Sem lancamentos'}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {largestExpense
                  ? `${formatCurrency(largestExpense.valor, currency)} em ${formatDate(largestExpense.data)}`
                  : 'Sem gasto registado neste periodo.'}
              </p>
            </article>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#5a4722] bg-[rgba(140,96,15,0.14)] px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-[#6e552b] bg-[rgba(140,96,15,0.18)] text-[var(--color-warning)]">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Agenda em aberto</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {pendingBills.length > 0
                    ? `${pendingBills.length} conta(s) pendente(s) acompanhada(s) na base.`
                    : 'Nao ha contas pendentes na base atual.'}
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Panel description="Composicao dos gastos do periodo por categoria." title="Gastos por categoria">
          {expenseCategoryRows.length > 0 ? (
            <DonutChart
              centerLabel="Total gasto"
              centerValue={formatCurrency(gastosTotal, currency)}
              segments={expenseCategoryRows.map(([label, value], index) => ({
                color: SOLID_COLORS[index % SOLID_COLORS.length],
                displayValue: formatCurrency(value, currency),
                helper: `${formatRatio(totalCategoryAmount > 0 ? value / totalCategoryAmount : 0)} do periodo`,
                label,
                value,
              }))}
            />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Nenhum gasto registado neste periodo.</p>
          )}
        </Panel>

        <Panel description="Fontes de entrada do caixa e metodos mais usados nas saidas." title="Receitas e metodos">
          {incomeSourceRows.length > 0 ? (
            <div className="space-y-5">
              <MiniBarChart
                data={incomeSourceRows.map(([label, value], index) => ({
                  color: CHART_GRADIENTS[index % CHART_GRADIENTS.length],
                  displayValue: formatCurrency(value, currency),
                  label,
                  value,
                }))}
              />

              <div className="space-y-3">
                {incomeSourceRows.map(([label, value]) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-[var(--text-primary)]">{label}</span>
                      <span className="font-mono text-xs text-[var(--text-secondary)]">
                        {formatCurrency(value, currency)} | {formatRatio(totalIncomeSources > 0 ? value / totalIncomeSources : 0)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-strong))]"
                        style={{ width: `${Math.max(totalIncomeSources > 0 ? (value / totalIncomeSources) * 100 : 0, 6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Nenhuma receita registada neste periodo.</p>
          )}

          <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Metodos de pagamento</p>
            <div className="mt-4 space-y-3">
              {paymentMethodRows.length > 0 ? (
                paymentMethodRows.slice(0, 5).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 text-sm"
                  >
                    <span className="text-[var(--text-primary)]">{label}</span>
                    <span className="font-mono text-[var(--text-secondary)]">
                      {formatCurrency(value, currency)} | {formatRatio(totalPaymentMethods > 0 ? value / totalPaymentMethods : 0)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">Ainda nao ha metodos registados no periodo.</p>
              )}
            </div>
          </div>
        </Panel>
      </div>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel
          actions={
            <button
              className={BUTTON_PRIMARY}
              disabled={submittingForm === 'expense'}
              onClick={() => void handleCreateExpense()}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Registar gasto
            </button>
          }
          description="Lanca despesas avulsas ou recorrentes diretamente na base."
          title="Novo gasto"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Descricao</span>
              <input
                className={INPUT_BASE}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Internet, renda, software..."
                type="text"
                value={expenseForm.description}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Valor</span>
              <input
                className={INPUT_BASE}
                min="0"
                onChange={(event) => setExpenseForm((current) => ({ ...current, value: event.target.value }))}
                placeholder="0"
                step="0.01"
                type="number"
                value={expenseForm.value}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Data</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={expenseForm.date}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Categoria</span>
              <select
                className={INPUT_BASE}
                onChange={(event) =>
                  setExpenseForm((current) => ({
                    ...current,
                    category: event.target.value,
                    customCategory: event.target.value === CUSTOM_CATEGORY_VALUE ? current.customCategory : '',
                  }))
                }
                value={expenseForm.category}
              >
                <option value="">Seleciona uma categoria</option>
                {expenseCategoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value={CUSTOM_CATEGORY_VALUE}>Outra categoria</option>
              </select>
            </label>

            {expenseForm.category === CUSTOM_CATEGORY_VALUE ? (
              <label className="space-y-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Categoria personalizada</span>
                <input
                  className={INPUT_BASE}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, customCategory: event.target.value }))
                  }
                  placeholder="Escreve a categoria"
                  type="text"
                  value={expenseForm.customCategory}
                />
              </label>
            ) : null}

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Metodo</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setExpenseForm((current) => ({ ...current, method: event.target.value }))}
                placeholder="Transferencia, cartao, dinheiro..."
                type="text"
                value={expenseForm.method}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Dia de vencimento</span>
              <input
                className={INPUT_BASE}
                disabled={!expenseForm.recurring}
                max="31"
                min="1"
                onChange={(event) => setExpenseForm((current) => ({ ...current, dueDay: event.target.value }))}
                placeholder="Opcional"
                type="number"
                value={expenseForm.dueDay}
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[#1b1b20] bg-[#0b0b0d] px-4 py-3 text-sm text-[#f0f0f0]">
              <input
                checked={expenseForm.recurring}
                className="h-4 w-4 accent-[var(--brand)]"
                onChange={(event) =>
                  setExpenseForm((current) => ({
                    ...current,
                    dueDay: event.target.checked ? current.dueDay : '',
                    recurring: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Conta recorrente
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[#1b1b20] bg-[#0b0b0d] px-4 py-3 text-sm text-[#f0f0f0]">
              <input
                checked={expenseForm.paid}
                className="h-4 w-4 accent-[var(--brand)]"
                onChange={(event) => setExpenseForm((current) => ({ ...current, paid: event.target.checked }))}
                type="checkbox"
              />
              Ja esta pago
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Notas</span>
              <textarea
                className={TEXTAREA_BASE}
                onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Contexto, fornecedor, referencia..."
                value={expenseForm.notes}
              />
            </label>
          </div>
        </Panel>

        <Panel
          actions={
            <button
              className={BUTTON_PRIMARY}
              disabled={submittingForm === 'income'}
              onClick={() => void handleCreateIncome()}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Registar receita
            </button>
          }
          description="Lanca entradas avulsas ou associa pagamentos a um projeto existente."
          title="Nova receita"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Descricao</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setIncomeForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Pagamento de projeto, venda, servico..."
                type="text"
                value={incomeForm.description}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Valor</span>
              <input
                className={INPUT_BASE}
                min="0"
                onChange={(event) => setIncomeForm((current) => ({ ...current, value: event.target.value }))}
                placeholder="0"
                step="0.01"
                type="number"
                value={incomeForm.value}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Data</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setIncomeForm((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={incomeForm.date}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Origem</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setIncomeForm((current) => ({ ...current, source: event.target.value }))}
                placeholder="Cliente, servico, reembolso..."
                type="text"
                value={incomeForm.source}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Projeto ligado</span>
              <select
                className={INPUT_BASE}
                onChange={(event) => setIncomeForm((current) => ({ ...current, projectId: event.target.value }))}
                value={incomeForm.projectId}
              >
                <option value="">Sem projeto associado</option>
                {projetos.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.titulo}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.12fr,0.88fr]">
        <Panel
          description={`Mostrando ${visibleExpenses.length} de ${gastosMes.length} gasto(s) em ${monthLabel}.`}
          title="Gastos do periodo"
        >
          <div className="space-y-3">
            {visibleExpenses.length > 0 ? (
              visibleExpenses.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[26px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.descricao}</p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
                            item.pago === 1
                              ? 'border-[#153127] bg-[#08130f] text-[#1d9e75]'
                              : 'border-[#3d2800] bg-[#120d00] text-[#ef9f27]'
                          }`}
                        >
                          {item.pago === 1 ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        {getExpenseCategoryLabel(item)} | {formatDate(item.data)}
                        {item.metodo ? ` | ${item.metodo}` : ''}
                      </p>
                      {item.notas ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.notas}</p> : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-[#e24b4a]">-{formatCurrency(item.valor, currency)}</span>
                      <button
                        className={`${BUTTON_SECONDARY} px-3 py-2 text-xs`}
                        disabled={deletingExpenseId === item.id}
                        onClick={() => void handleDeleteExpense(item.id, item.descricao)}
                        type="button"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Nenhum gasto encontrado com os filtros atuais.</p>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel
            description={`Mostrando ${visibleIncome.length} de ${receitasMes.length} receita(s) em ${monthLabel}.`}
            title="Receitas do periodo"
          >
            <div className="space-y-3">
              {visibleIncome.length > 0 ? (
                visibleIncome.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[26px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.descricao}</p>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          {formatDate(item.data)} | {getIncomeSourceLabel(item)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-[#1d9e75]">+{formatCurrency(item.valor, currency)}</span>
                        <button
                          className={`${BUTTON_SECONDARY} px-3 py-2 text-xs`}
                          disabled={deletingIncomeId === item.id}
                          onClick={() => void handleDeleteIncome(item.id, item.descricao)}
                          type="button"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">Nenhuma receita encontrada com os filtros atuais.</p>
              )}
            </div>
          </Panel>

          <Panel description="Pendencias abertas e recorrencias mapeadas para o periodo." title="Agenda financeira">
            <div className="space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Contas pendentes</p>
                <div className="mt-3 space-y-3">
                  {pendingBills.length > 0 ? (
                    pendingBills.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{item.descricao}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {getExpenseCategoryLabel(item)} | {formatDate(item.data)}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-[var(--color-warning)]">
                          {formatCurrency(item.valor, currency)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">Nao existem contas pendentes na base atual.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Recorrencias</p>
                <div className="mt-3 space-y-3">
                  {recurringRows.length > 0 ? (
                    recurringRows.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{item.descricao}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {getExpenseCategoryLabel(item)} | {getDueStatusLabel(item.dueDate, currentMonthView)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] ${
                            item.pago === 1
                              ? 'border-[#153127] bg-[#08130f] text-[#1d9e75]'
                              : 'border-[#3d2800] bg-[#120d00] text-[#ef9f27]'
                          }`}
                        >
                          {item.pago === 1 ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">Nenhuma conta recorrente cadastrada.</p>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
            janeiro a dezembro · {selectedYear}
          </div>
        }
        description="Mapa anual em ordem cronologica, com 12 meses clicaveis, leitura acumulada e foco imediato no mes ativo."
        title="Resumo anual"
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">YTD ate {monthLabel}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
              {formatCurrency(yearToDateNet, currency)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {formatCurrency(yearToDateIncome, currency)} em entradas vs {formatCurrency(yearToDateExpenses, currency)} em saidas.
            </p>
          </article>

          <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Fluxo anual</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
              {formatCurrency(annualIncome - annualExpenses, currency)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {formatCurrency(annualIncome, currency)} recebidos e {formatCurrency(annualExpenses, currency)} gastos no ano.
            </p>
          </article>

          <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Melhor saldo</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
              {bestMonth ? formatCurrency(bestMonth.net, currency) : formatCurrency(0, currency)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {bestMonth ? `${bestMonth.label} foi o melhor fecho do ano.` : 'Ainda sem dados no ano selecionado.'}
            </p>
          </article>

          <article className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Pico operacional</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
              {mostActiveMonth ? formatCurrency(mostActiveMonth.activity, currency) : formatCurrency(0, currency)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {mostActiveMonth ? `${mostActiveMonth.label} concentrou o maior volume do ano.` : 'Sem volume registado ainda.'}
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {annualSummaryRows.map((row) => {
            const activityWidth = Math.max((row.activity / annualActivityMax) * 100, row.activity > 0 ? 8 : 0)

            return (
              <button
                key={row.month}
                className={[
                  'rounded-[26px] border p-4 text-left transition',
                  row.isActive
                    ? 'border-[rgba(255,255,255,0.2)] bg-[linear-gradient(180deg,rgba(20,20,20,0.98),rgba(6,6,6,0.98))] shadow-[0_20px_44px_rgba(255,255,255,0.04)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]',
                ].join(' ')}
                onClick={() => setSelectedMonth(row.month)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      {row.monthChip}
                    </span>
                    <p className="mt-3 text-lg font-semibold capitalize tracking-[-0.04em] text-[var(--text-primary)]">
                      {row.label}
                    </p>
                  </div>
                  <span
                    className={[
                      'rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.24em]',
                      row.net >= 0
                        ? 'border-[#143d31] bg-[rgba(20,86,58,0.18)] text-[#7ef7c8]'
                        : 'border-[#4a1f2a] bg-[rgba(113,29,43,0.18)] text-[#ff8aa0]',
                    ].join(' ')}
                  >
                    {row.isActive ? 'ativo' : formatRatio(row.margin)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Receitas</p>
                    <p className="mt-2 font-mono text-sm text-[var(--color-success)]">{formatCurrency(row.income, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Gastos</p>
                    <p className="mt-2 font-mono text-sm text-[var(--color-danger)]">{formatCurrency(row.expenses, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Saldo</p>
                    <p className="mt-2 font-mono text-sm text-[var(--text-primary)]">{formatCurrency(row.net, currency)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    <span>Volume do mes</span>
                    <span>{formatCurrency(row.activity, currency)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(46,255,168,0.95),rgba(30,152,218,0.72))]"
                      style={{ width: `${activityWidth}%` }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

import { PlusCircle, RefreshCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { FullScreenLoader } from '../components/full-screen-loader'
import { Panel } from '../components/panel'
import { StatCard } from '../components/stat-card'
import { useAsyncData } from '../hooks/use-async-data'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  INPUT_BASE,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getMonthBounds,
  isWithinDateRange,
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

const TEXTAREA_BASE = `${INPUT_BASE} min-h-[110px] resize-y`

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function FinancePage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchFinanceSnapshot)
  const [monthOffset, setMonthOffset] = useState('0')
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    date: getTodayInputValue(),
    description: '',
    dueDay: '',
    method: '',
    notes: '',
    paid: true,
    recurring: false,
    value: '',
  })
  const [incomeForm, setIncomeForm] = useState({
    date: getTodayInputValue(),
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
  const currency = configuracoes.moeda ?? 'CVE'
  const options = Array.from({ length: 12 }).map((_, index) => {
    const reference = shiftMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1), -index)
    return { label: formatMonthLabel(reference), value: String(index) }
  })
  const reference = shiftMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1), -Number(monthOffset))
  const { end, start } = getMonthBounds(reference)
  const gastosMes = gastos.filter((item) => isWithinDateRange(item.data, start, end))
  const receitasMes = receitas.filter((item) => isWithinDateRange(item.data, start, end))
  const gastosTotal = sumBy(gastosMes, (item) => item.valor)
  const receitasTotal = sumBy(receitasMes, (item) => item.valor)
  const pendentes = gastosMes.filter((item) => item.pago === 0).length
  const recorrentes = gastos.filter((item) => item.recorrente === 1).slice(0, 10)
  const saldo = receitasTotal - gastosTotal

  async function handleCreateExpense() {
    setFeedback(null)
    setActionError(null)
    setSubmittingForm('expense')

    try {
      await createGasto({
        category: expenseForm.category,
        date: expenseForm.date,
        description: expenseForm.description,
        dueDay: expenseForm.recurring && expenseForm.dueDay ? Number(expenseForm.dueDay) : null,
        method: expenseForm.method,
        notes: expenseForm.notes,
        paid: expenseForm.paid,
        recurring: expenseForm.recurring,
        value: expenseForm.value ? Number(expenseForm.value) : 0,
      })

      setExpenseForm({
        category: '',
        date: getTodayInputValue(),
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

      setIncomeForm({
        date: getTodayInputValue(),
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
              <input
                className={INPUT_BASE}
                onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Operacao, marketing, impostos..."
                type="text"
                value={expenseForm.category}
              />
            </label>

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
                className="h-4 w-4 accent-[#e94560]"
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
                className="h-4 w-4 accent-[#e94560]"
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

      {feedback ? <p className="text-sm text-[#1d9e75]">{feedback}</p> : null}
      {actionError ? <p className="text-sm text-[#e24b4a]">{actionError}</p> : null}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <select
          className={`${INPUT_BASE} min-w-[220px]`}
          onChange={(event) => setMonthOffset(event.target.value)}
          value={monthOffset}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard accent="#e24b4a" label="Gastos totais" value={formatCurrency(gastosTotal, currency)} />
        <StatCard accent="#1d9e75" label="Receitas" value={formatCurrency(receitasTotal, currency)} />
        <StatCard
          accent={saldo >= 0 ? '#1d9e75' : '#e24b4a'}
          label="Saldo"
          value={formatCurrency(saldo, currency)}
        />
        <StatCard accent="#ef9f27" label="Pendentes" value={String(pendentes)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,1fr]">
        <Panel description="Gastos do mes selecionado com remocao direta." title="Gastos do mes">
          <div className="space-y-3">
            {gastosMes.length > 0 ? (
              gastosMes.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#171717] bg-[#090909] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[#f0f0f0]">{item.descricao}</p>
                    <p className="mt-1 text-xs text-[#666666]">
                      {item.categoria_nome || 'Sem categoria'} · {formatDate(item.data)}
                    </p>
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
              ))
            ) : (
              <p className="text-sm text-[#888888]">Nenhum gasto registado neste mes.</p>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel description="Receitas do periodo com ligacao opcional a projetos." title="Receitas do mes">
            <div className="space-y-3">
              {receitasMes.length > 0 ? (
                receitasMes.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#171717] bg-[#090909] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f0]">{item.descricao}</p>
                      <p className="mt-1 text-xs text-[#666666]">
                        {formatDate(item.data)}
                        {item.origem ? ` · ${item.origem}` : ''}
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
                ))
              ) : (
                <p className="text-sm text-[#888888]">Nenhuma receita registada neste mes.</p>
              )}
            </div>
          </Panel>

          <Panel description="Despesas recorrentes acompanhadas pela base atual." title="Contas recorrentes">
            <div className="space-y-3">
              {recorrentes.length > 0 ? (
                recorrentes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-[#171717] bg-[#090909] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f0]">{item.descricao}</p>
                      <p className="mt-1 text-xs text-[#666666]">
                        Vencimento {item.dia_vencimento ? `dia ${item.dia_vencimento}` : formatDate(item.data)}
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
                <p className="text-sm text-[#888888]">Nenhuma conta recorrente cadastrada.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

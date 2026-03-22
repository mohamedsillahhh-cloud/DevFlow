import { PlusCircle, RefreshCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  getRelationItem,
  getMonthBounds,
  isWithinDateRange,
  sumBy,
} from '../lib/format'
import {
  createAporte,
  createInvestimento,
  deleteAporte,
  deleteInvestimento,
  fetchInvestmentsSnapshot,
} from '../lib/supabase-data'

const TEXTAREA_BASE = `${INPUT_BASE} min-h-[110px] resize-y`

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function InvestmentsPage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchInvestmentsSnapshot)
  const [investmentForm, setInvestmentForm] = useState({
    active: true,
    name: '',
    notes: '',
    targetDate: '',
    targetValue: '',
    type: '',
  })
  const [movementForm, setMovementForm] = useState({
    date: getTodayInputValue(),
    investmentId: '',
    notes: '',
    type: 'aporte',
    value: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [submittingForm, setSubmittingForm] = useState<'investment' | 'movement' | null>(null)
  const [deletingInvestmentId, setDeletingInvestmentId] = useState<number | null>(null)
  const [deletingMovementId, setDeletingMovementId] = useState<number | null>(null)

  useEffect(() => {
    if (!data || movementForm.investmentId || data.investimentos.length === 0) {
      return
    }

    setMovementForm((current) => ({ ...current, investmentId: String(data.investimentos[0].id) }))
  }, [data, movementForm.investmentId])

  if (isLoading && !data) {
    return <FullScreenLoader label="A carregar os investimentos..." />
  }

  if (error || !data) {
    return (
      <Panel
        actions={
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            Tentar novamente
          </button>
        }
        description={error ?? 'Nao foi possivel carregar os investimentos.'}
        title="Falha ao carregar"
      />
    )
  }

  const { aportes, configuracoes, investimentos } = data
  const currency = configuracoes.moeda ?? 'CVE'
  const { end, start } = getMonthBounds()
  const aporteTotal = sumBy(aportes, (item) => item.valor, (item) => item.tipo === 'aporte')
  const resgateTotal = sumBy(aportes, (item) => item.valor, (item) => item.tipo === 'resgate')
  const rendimentoTotal = sumBy(aportes, (item) => item.valor, (item) => item.tipo === 'rendimento')
  const totalInvestido = aporteTotal + rendimentoTotal - resgateTotal
  const aportadoMes = sumBy(
    aportes,
    (item) => item.valor,
    (item) => item.tipo === 'aporte' && isWithinDateRange(item.data, start, end),
  )
  const progressRows = investimentos.map((investment) => {
    const totalItem = aportes.reduce((accumulator, item) => {
      if (item.investimento_id !== investment.id) {
        return accumulator
      }
      if (item.tipo === 'resgate') {
        return accumulator - item.valor
      }
      return accumulator + item.valor
    }, 0)

    return { investment, totalItem }
  })
  const metasAtingidas = progressRows.filter(
    ({ investment, totalItem }) => Boolean(investment.meta_valor && totalItem >= investment.meta_valor),
  ).length
  const totalAllocationBase = progressRows.reduce(
    (accumulator, item) => accumulator + Math.max(item.totalItem, 0),
    0,
  )
  const allocationRows = Object.entries(
    progressRows.reduce<Record<string, number>>((accumulator, item) => {
      const key = item.investment.tipo || 'Sem tipo'
      accumulator[key] = (accumulator[key] ?? 0) + Math.max(item.totalItem, 0)
      return accumulator
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)

  async function handleCreateInvestment() {
    setFeedback(null)
    setActionError(null)
    setSubmittingForm('investment')

    try {
      await createInvestimento({
        active: investmentForm.active,
        name: investmentForm.name,
        notes: investmentForm.notes,
        targetDate: investmentForm.targetDate || null,
        targetValue: investmentForm.targetValue ? Number(investmentForm.targetValue) : null,
        type: investmentForm.type,
      })

      setInvestmentForm({
        active: true,
        name: '',
        notes: '',
        targetDate: '',
        targetValue: '',
        type: '',
      })
      setFeedback('Investimento criado com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : 'Nao foi possivel criar o investimento.',
      )
    } finally {
      setSubmittingForm(null)
    }
  }

  async function handleCreateMovement() {
    setFeedback(null)
    setActionError(null)
    setSubmittingForm('movement')

    try {
      await createAporte({
        date: movementForm.date,
        investmentId: Number(movementForm.investmentId),
        notes: movementForm.notes,
        type: movementForm.type,
        value: movementForm.value ? Number(movementForm.value) : 0,
      })

      setMovementForm((current) => ({
        ...current,
        date: getTodayInputValue(),
        notes: '',
        type: 'aporte',
        value: '',
      }))
      setFeedback('Movimento registado com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel registar o movimento.')
    } finally {
      setSubmittingForm(null)
    }
  }

  async function handleDeleteInvestment(investmentId: number, investmentName: string) {
    const shouldDelete = window.confirm(
      `Remover o investimento "${investmentName}"? Todos os movimentos ligados tambem serao removidos.`,
    )
    if (!shouldDelete) {
      return
    }

    setFeedback(null)
    setActionError(null)
    setDeletingInvestmentId(investmentId)

    try {
      await deleteInvestimento(investmentId)
      setFeedback('Investimento removido com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : 'Nao foi possivel remover o investimento.',
      )
    } finally {
      setDeletingInvestmentId(null)
    }
  }

  async function handleDeleteMovement(aporteId: number, label: string) {
    const shouldDelete = window.confirm(`Remover o movimento "${label}"?`)
    if (!shouldDelete) {
      return
    }

    setFeedback(null)
    setActionError(null)
    setDeletingMovementId(aporteId)

    try {
      await deleteAporte(aporteId)
      setFeedback('Movimento removido com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel remover o movimento.')
    } finally {
      setDeletingMovementId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel
          actions={
            <button
              className={BUTTON_PRIMARY}
              disabled={submittingForm === 'investment'}
              onClick={() => void handleCreateInvestment()}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar investimento
            </button>
          }
          description="Regista um novo ativo com meta opcional e estado ativo."
          title="Novo investimento"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Nome</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setInvestmentForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="ETF global, reserva, crypto..."
                type="text"
                value={investmentForm.name}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Tipo</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setInvestmentForm((current) => ({ ...current, type: event.target.value }))}
                placeholder="ETF, acao, fundo, poupanca..."
                type="text"
                value={investmentForm.type}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Meta de valor</span>
              <input
                className={INPUT_BASE}
                min="0"
                onChange={(event) =>
                  setInvestmentForm((current) => ({ ...current, targetValue: event.target.value }))
                }
                placeholder="Opcional"
                step="0.01"
                type="number"
                value={investmentForm.targetValue}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Meta de data</span>
              <input
                className={INPUT_BASE}
                onChange={(event) =>
                  setInvestmentForm((current) => ({ ...current, targetDate: event.target.value }))
                }
                type="date"
                value={investmentForm.targetDate}
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[#1b1b20] bg-[#0b0b0d] px-4 py-3 text-sm text-[#f0f0f0] md:col-span-2">
              <input
                checked={investmentForm.active}
                className="h-4 w-4 accent-[#e94560]"
                onChange={(event) =>
                  setInvestmentForm((current) => ({ ...current, active: event.target.checked }))
                }
                type="checkbox"
              />
              Ativo habilitado para novos movimentos
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Notas</span>
              <textarea
                className={TEXTAREA_BASE}
                onChange={(event) => setInvestmentForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Corretora, observacoes, objetivo..."
                value={investmentForm.notes}
              />
            </label>
          </div>
        </Panel>

        <Panel
          actions={
            <button
              className={BUTTON_PRIMARY}
              disabled={submittingForm === 'movement' || investimentos.length === 0}
              onClick={() => void handleCreateMovement()}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Registar movimento
            </button>
          }
          description="Adiciona aportes, resgates ou rendimentos a um investimento existente."
          title="Novo movimento"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Investimento</span>
              <select
                className={INPUT_BASE}
                disabled={investimentos.length === 0}
                onChange={(event) =>
                  setMovementForm((current) => ({ ...current, investmentId: event.target.value }))
                }
                value={movementForm.investmentId}
              >
                <option value="">Selecione um investimento</option>
                {investimentos.map((investment) => (
                  <option key={investment.id} value={investment.id}>
                    {investment.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Tipo</span>
              <select
                className={INPUT_BASE}
                onChange={(event) => setMovementForm((current) => ({ ...current, type: event.target.value }))}
                value={movementForm.type}
              >
                <option value="aporte">Aporte</option>
                <option value="resgate">Resgate</option>
                <option value="rendimento">Rendimento</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Valor</span>
              <input
                className={INPUT_BASE}
                min="0"
                onChange={(event) => setMovementForm((current) => ({ ...current, value: event.target.value }))}
                placeholder="0"
                step="0.01"
                type="number"
                value={movementForm.value}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Data</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setMovementForm((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={movementForm.date}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Notas</span>
              <textarea
                className={TEXTAREA_BASE}
                onChange={(event) => setMovementForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Corretora, justificacao, observacao..."
                value={movementForm.notes}
              />
            </label>
          </div>

          {investimentos.length === 0 ? (
            <p className="mt-4 text-sm text-[#888888]">
              Cria primeiro um investimento para poderes registar movimentos.
            </p>
          ) : null}
        </Panel>
      </div>

      {feedback ? <p className="text-sm text-[#1d9e75]">{feedback}</p> : null}
      {actionError ? <p className="text-sm text-[#e24b4a]">{actionError}</p> : null}

      <div className="flex justify-end">
        <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard accent="#378add" label="Total investido" value={formatCurrency(totalInvestido, currency)} />
        <StatCard accent="#1d9e75" label="Aportado este mes" value={formatCurrency(aportadoMes, currency)} />
        <StatCard accent="#ef9f27" label="Rendimento acumulado" value={formatCurrency(rendimentoTotal, currency)} />
        <StatCard
          accent="#e94560"
          label="Metas atingidas"
          value={`${metasAtingidas} / ${progressRows.length}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Panel description="Total atual por ativo, progresso da meta e remocao direta." title="Progresso das metas">
          <div className="space-y-5">
            {progressRows.length > 0 ? (
              progressRows.map(({ investment, totalItem }) => {
                const percent =
                  investment.meta_valor && investment.meta_valor > 0
                    ? Math.min((totalItem / investment.meta_valor) * 100, 100)
                    : 0
                const missing = Math.max((investment.meta_valor ?? 0) - totalItem, 0)

                return (
                  <div key={investment.id} className="space-y-3 rounded-2xl border border-[#171717] bg-[#090909] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#f0f0f0]">{investment.nome}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#666666]">{investment.tipo}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#888888]">{formatCurrency(totalItem, currency)}</span>
                        <button
                          className={`${BUTTON_SECONDARY} px-3 py-2 text-xs`}
                          disabled={deletingInvestmentId === investment.id}
                          onClick={() => void handleDeleteInvestment(investment.id, investment.nome)}
                          type="button"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Remover
                        </button>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
                      <div className="h-full rounded-full bg-[#e94560]" style={{ width: `${percent}%` }} />
                    </div>
                    {investment.meta_valor ? (
                      <p className="text-xs text-[#666666]">
                        {Math.round(percent)}% · faltam {formatCurrency(missing, currency)} · meta {formatDate(investment.meta_data)}
                      </p>
                    ) : (
                      <p className="text-xs text-[#666666]">Sem meta definida.</p>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[#888888]">Nenhum investimento cadastrado ainda.</p>
            )}
          </div>
        </Panel>

        <Panel description="Distribuicao atual por tipo de investimento." title="Alocacao por categoria">
          <div className="space-y-4">
            {allocationRows.length > 0 ? (
              allocationRows.map(([name, value]) => {
                const percent = totalAllocationBase > 0 ? (value / totalAllocationBase) * 100 : 0

                return (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#f0f0f0]">{name}</span>
                      <span className="font-mono text-xs text-[#888888]">
                        {formatCurrency(value, currency)} · {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
                      <div
                        className="h-full rounded-full bg-[#378add]"
                        style={{ width: `${Math.max(percent, percent > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[#888888]">Ainda nao ha saldo alocado para mostrar.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel description="Aportes, resgates e rendimentos mais recentes." title="Movimentos recentes">
        {aportes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">
                  <th className="pb-2 pr-4 font-medium">Data</th>
                  <th className="pb-2 pr-4 font-medium">Ativo</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Valor</th>
                  <th className="pb-2 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {aportes.slice(0, 10).map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="rounded-l-2xl border-y border-l border-[#171717] bg-[#090909] px-4 py-3 text-[#888888]">
                      {formatDate(item.data)}
                    </td>
                    <td className="border-y border-[#171717] bg-[#090909] px-4 py-3 text-[#f0f0f0]">
                      {getRelationItem(item.investimentos)?.nome ?? 'Ativo removido'}
                    </td>
                    <td className="border-y border-[#171717] bg-[#090909] px-4 py-3 text-[#888888]">
                      {item.tipo || '-'}
                    </td>
                    <td
                      className={`border-y border-[#171717] bg-[#090909] px-4 py-3 font-mono ${
                        item.tipo === 'resgate' ? 'text-[#e24b4a]' : 'text-[#1d9e75]'
                      }`}
                    >
                      {item.tipo === 'resgate' ? '-' : '+'}
                      {formatCurrency(item.valor, currency)}
                    </td>
                    <td className="rounded-r-2xl border-y border-r border-[#171717] bg-[#090909] px-4 py-3">
                      <button
                        className={`${BUTTON_SECONDARY} px-3 py-2 text-xs`}
                        disabled={deletingMovementId === item.id}
                        onClick={() =>
                          void handleDeleteMovement(
                            item.id,
                            `${getRelationItem(item.investimentos)?.nome ?? 'Ativo'} ${item.tipo ?? 'movimento'}`,
                          )
                        }
                        type="button"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[#888888]">Nenhum aporte registado ainda.</p>
        )}
      </Panel>
    </div>
  )
}

import { Download, PlayCircle, RefreshCcw, Save, Square } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ExportDropdown } from '../components/shared/export-dropdown'
import { FullScreenLoader } from '../components/ui/full-screen-loader'
import { downloadCsv } from '../lib/export/export'
import { PageSectionNav } from '../components/layout/page-section-nav'
import { Panel } from '../components/ui/panel'
import { StatCard } from '../components/ui/stat-card'
import { useAsyncData } from '../hooks/use-async-data'
import { useRealtimeSync } from '../hooks/use-realtime-sync'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  INPUT_BASE,
  formatClockDuration,
  formatCurrency,
  formatDate,
  formatDurationMinutes,
  formatMonthLabel,
  getMonthBounds,
  getSessionProjectTitle,
  isWithinDateRange,
  shiftMonth,
} from '../lib/format'
import { getWorkspaceSection } from '../lib/navigation'
import { fetchTimerSnapshot, saveConfiguracoes, startWorkSession, stopWorkSession } from '../lib/supabase/supabase-data'

type ProjectRatesMap = Record<string, number>

function parsePositiveNumber(value: string | undefined) {
  const parsed = Number(value ?? '0')
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function parseProjectRates(rawValue: string | undefined): ProjectRatesMap {
  if (!rawValue) return {}
  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>
    return Object.entries(parsed).reduce<ProjectRatesMap>((accumulator, [key, value]) => {
      const numericValue = Number(value)
      if (Number.isFinite(numericValue) && numericValue >= 0) {
        accumulator[key] = numericValue
      }
      return accumulator
    }, {})
  } catch {
    return {}
  }
}

function formatDecimalHours(totalMinutes: number) {
  return `${(totalMinutes / 60).toFixed(2)}h`
}

export function TimerPage() {
  const location = useLocation()
  const { data, error, isLoading, reload } = useAsyncData(fetchTimerSnapshot)
  useRealtimeSync(['configuracoes', 'projetos', 'tempo_projeto'], reload, { pollIntervalMs: 8000 })
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [startDescription, setStartDescription] = useState('')
  const [stopDescription, setStopDescription] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingRates, setIsSavingRates] = useState(false)
  const [monthOffset, setMonthOffset] = useState('0')
  const [defaultRate, setDefaultRate] = useState('0')
  const [projectRates, setProjectRates] = useState<Record<string, string>>({})
  const [now, setNow] = useState(() => new Date())
  const section = getWorkspaceSection(location.pathname, '/timer', 'overview')
  const sectionNavItems = [
    { label: 'Overview', to: '/timer' },
    { label: 'Faturacao', to: '/timer/faturacao' },
    { label: 'Historico', to: '/timer/historico' },
  ]

  const [prevTimerData, setPrevTimerData] = useState(data)
  if (data && data !== prevTimerData) {
    setPrevTimerData(data)
    if (!selectedProjectId && data.projetos.length > 0) {
      setSelectedProjectId(String(data.projetos[0].id))
    }
    setDefaultRate(data.configuracoes.valor_hora_padrao ?? '0')
    setProjectRates(
      Object.fromEntries(
        Object.entries(parseProjectRates(data.configuracoes.valor_hora_projetos)).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
    )
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, index) => {
        const reference = shiftMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1), -index)
        return { label: formatMonthLabel(reference), value: String(index) }
      }),
    [],
  )

  if (isLoading && !data) {
    return <FullScreenLoader label="A carregar o timer..." />
  }

  if (error || !data) {
    return (
      <Panel
        actions={
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            Tentar novamente
          </button>
        }
        description={error ?? 'Nao foi possivel carregar o timer.'}
        title="Falha ao carregar"
      />
    )
  }

  const activeSession = data.sessoes.find((item) => !item.fim) ?? null
  const sessoes = data.sessoes
  const referenceMonth = shiftMonth(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    -Number(monthOffset),
  )
  const periodLabel = `${referenceMonth.getFullYear()}-${String(referenceMonth.getMonth() + 1).padStart(2, '0')}`
  const { end, start } = getMonthBounds(referenceMonth)
  const monthSessions = data.sessoes.filter((item) => isWithinDateRange(item.inicio, start, end))
  const totalMonthMinutes = monthSessions.reduce((accumulator, item) => {
    const minutes =
      item.duracao_min ??
      Math.max(
        Math.floor(((item.fim ? new Date(item.fim) : now).getTime() - new Date(item.inicio).getTime()) / 60000),
        0,
      )

    return accumulator + minutes
  }, 0)
  const recentSessions = data.sessoes.slice(0, 10)
  const currentConfig = data.configuracoes
  const currency = currentConfig.moeda ?? 'CVE'
  const effectiveDefaultRate = parsePositiveNumber(defaultRate)
  const normalizedProjectRates = Object.entries(projectRates).reduce<ProjectRatesMap>(
    (accumulator, [key, value]) => {
      const numericValue = parsePositiveNumber(value)
      if (numericValue > 0) {
        accumulator[key] = numericValue
      }
      return accumulator
    },
    {},
  )
  const groupedByProject = Object.values(
    monthSessions.reduce<
      Record<
        string,
        {
          count: number
          minutes: number
          projectId: number | null
          projectName: string
        }
      >
    >((accumulator, item) => {
      const key = item.projeto_id ? String(item.projeto_id) : `removed-${getSessionProjectTitle(item)}`
      const minutes =
        item.duracao_min ??
        Math.max(
          Math.floor(((item.fim ? new Date(item.fim) : now).getTime() - new Date(item.inicio).getTime()) / 60000),
          0,
        )

      accumulator[key] = accumulator[key] ?? {
        count: 0,
        minutes: 0,
        projectId: item.projeto_id ?? null,
        projectName: getSessionProjectTitle(item),
      }
      accumulator[key].count += 1
      accumulator[key].minutes += minutes
      return accumulator
    }, {}),
  )
    .map((item) => {
      const rate =
        item.projectId !== null && normalizedProjectRates[String(item.projectId)] !== undefined
          ? normalizedProjectRates[String(item.projectId)]
          : effectiveDefaultRate
      const estimatedAmount = (item.minutes / 60) * rate

      return { ...item, estimatedAmount, rate }
    })
    .sort((left, right) => right.estimatedAmount - left.estimatedAmount || right.minutes - left.minutes)

  const totalEstimatedAmount = groupedByProject.reduce(
    (accumulator, item) => accumulator + item.estimatedAmount,
    0,
  )

  async function handleStart() {
    if (!selectedProjectId) {
      setActionError('Selecione um projeto antes de iniciar.')
      return
    }

    setActionError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      await startWorkSession(Number(selectedProjectId), startDescription)
      setStartDescription('')
      setFeedback('Sessao iniciada com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel iniciar a sessao.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStop() {
    if (!activeSession) {
      setActionError('Nenhuma sessao ativa para encerrar.')
      return
    }

    setActionError(null)
    setFeedback(null)
    setIsSubmitting(true)

    try {
      await stopWorkSession(activeSession, stopDescription)
      setStopDescription('')
      setFeedback('Sessao encerrada com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel encerrar a sessao.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveRates() {
    setActionError(null)
    setFeedback(null)
    setIsSavingRates(true)

    try {
      await saveConfiguracoes({
        ...currentConfig,
        valor_hora_padrao: String(parsePositiveNumber(defaultRate)),
        valor_hora_projetos: JSON.stringify(normalizedProjectRates),
      })
      setFeedback('Taxas horarias guardadas com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel guardar as taxas.')
    } finally {
      setIsSavingRates(false)
    }
  }

  function handleExportBillingCsv() {
    downloadCsv(
      `faturacao-timer-${periodLabel}`,
      [
        { label: 'Projeto', value: (item: typeof groupedByProject[number]) => item.projectName },
        { label: 'Sessoes', value: (item: typeof groupedByProject[number]) => String(item.count) },
        { label: 'Horas', value: (item: typeof groupedByProject[number]) => (item.minutes / 60).toFixed(2) },
        { label: 'Valor/Hora', value: (item: typeof groupedByProject[number]) => item.rate.toFixed(2) },
        { label: 'Total Faturavel', value: (item: typeof groupedByProject[number]) => item.estimatedAmount.toFixed(2) },
      ],
      groupedByProject,
    )
    setFeedback('CSV de faturacao exportado com sucesso.')
    setActionError(null)
  }

  return (
    <div className="space-y-6">
      <PageSectionNav
        helper="Controlo do timer, faturacao e historico agora estao separados para o fluxo ficar menos pesado."
        items={sectionNavItems}
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <select
          className={`${INPUT_BASE} min-w-0 w-full xl:max-w-[280px]`}
          onChange={(event) => setMonthOffset(event.target.value)}
          value={monthOffset}
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap justify-end gap-3">
          <button className={BUTTON_SECONDARY} onClick={handleExportBillingCsv} type="button">
            <Download className="mr-2 h-4 w-4" />
            Faturação CSV
          </button>
          <ExportDropdown data={sessoes} type="sessoes" filename={periodLabel} label="Sessões" />
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {section !== 'historico' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          accent={activeSession ? 'var(--color-accent-green)' : 'var(--text-muted)'}
          label={activeSession ? 'Sessao ativa' : 'Sem sessao ativa'}
          value={activeSession ? formatClockDuration(activeSession, now) : '--:--:--'}
        />
        <StatCard accent="var(--color-accent-blue)" label="Sessoes no mes" value={String(monthSessions.length)} />
        <StatCard accent="var(--color-accent-orange)" label="Horas no mes" value={formatDurationMinutes(totalMonthMinutes)} />
        <StatCard
          accent="var(--brand)"
          label="Faturavel"
          subtitle="estimativa do mes"
          value={formatCurrency(totalEstimatedAmount, currency)}
        />
        </div>
      ) : null}

      {section !== 'historico' ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr,1fr]">
        {section === 'overview' ? (
          <Panel description="Inicie ou encerre a sessao atual do projeto." title="Controlo do timer">
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {activeSession ? 'Sessao ativa' : 'Sem sessao ativa'}
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                {activeSession ? formatClockDuration(activeSession, now) : '--:--:--'}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {activeSession
                  ? `Projeto atual: ${getSessionProjectTitle(activeSession)}`
                  : 'Selecione um projeto e inicie uma nova sessao.'}
              </p>
            </div>

            <div className="space-y-3">
              <select
                className={INPUT_BASE}
                disabled={Boolean(activeSession)}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                value={selectedProjectId}
              >
                <option value="">Selecione um projeto</option>
                {data.projetos.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.titulo}
                  </option>
                ))}
              </select>

              <input
                className={INPUT_BASE}
                disabled={Boolean(activeSession)}
                onChange={(event) => setStartDescription(event.target.value)}
                placeholder="Descricao opcional da sessao"
                type="text"
                value={startDescription}
              />

              <div className="flex flex-col gap-3">
                <button
                  className={BUTTON_PRIMARY}
                  disabled={Boolean(activeSession) || isSubmitting}
                  onClick={() => void handleStart()}
                  type="button"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Iniciar sessao
                </button>

                <input
                  className={INPUT_BASE}
                  disabled={!activeSession}
                  onChange={(event) => setStopDescription(event.target.value)}
                  placeholder="Descricao final da sessao"
                  type="text"
                  value={stopDescription}
                />

                <button
                  className={BUTTON_SECONDARY}
                  disabled={!activeSession || isSubmitting}
                  onClick={() => void handleStop()}
                  type="button"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Encerrar
                </button>
              </div>
            </div>
          </div>
          </Panel>
        ) : null}

        {section === 'faturacao' ? (
          <Panel
          actions={
            <button
              className={BUTTON_SECONDARY}
              disabled={isSavingRates}
              onClick={() => void handleSaveRates()}
              type="button"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar taxas
            </button>
          }
          description="Define a taxa padrao e, se precisares, um valor por hora especifico para cada projeto."
          title="Faturacao"
        >
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Valor/hora padrao</span>
              <input
                className={INPUT_BASE}
                min="0"
                onChange={(event) => setDefaultRate(event.target.value)}
                step="0.01"
                type="number"
                value={defaultRate}
              />
            </label>

            {groupedByProject.length > 0 ? (
              <div className="space-y-3">
                {groupedByProject.map((item) => {
                  const projectKey = item.projectId !== null ? String(item.projectId) : ''
                  const inputValue =
                    projectKey && projectRates[projectKey] !== undefined
                      ? projectRates[projectKey]
                      : String(item.rate)

                  return (
                    <div
                      key={`${item.projectName}-${projectKey || 'removed'}`}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{item.projectName}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {item.count} sessao(oes) · {formatDecimalHours(item.minutes)}
                          </p>
                        </div>
                        {projectKey ? (
                          <div className="w-full md:w-[170px]">
                            <input
                              className={INPUT_BASE}
                              min="0"
                              onChange={(event) =>
                                setProjectRates((current) => ({ ...current, [projectKey]: event.target.value }))
                              }
                              step="0.01"
                              type="number"
                              value={inputValue}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Projeto removido</span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-[var(--text-secondary)] md:grid-cols-2">
                        <p>Taxa usada: <span className="font-mono text-[var(--text-primary)]">{formatCurrency(item.rate, currency)}</span></p>
                        <p>Faturavel: <span className="font-mono text-[var(--color-accent-green)]">{formatCurrency(item.estimatedAmount, currency)}</span></p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Sem sessoes no periodo para calcular faturacao.</p>
            )}
          </div>
          </Panel>
        ) : null}
      </div>
      ) : null}

      {feedback ? <p className="text-sm text-[var(--color-success)]">{feedback}</p> : null}
      {actionError ? <p className="text-sm text-[var(--color-danger)]">{actionError}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        {section === 'faturacao' ? (
        <Panel description="Tempo acumulado e faturavel por projeto no periodo selecionado." title="Resumo faturavel">
          {groupedByProject.length > 0 ? (
            <div className="space-y-3">
              {groupedByProject.map((item) => (
                <div
                  key={`${item.projectName}-${item.projectId ?? 'removed'}`}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.projectName}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {item.count} sessao(oes) · {formatDurationMinutes(item.minutes)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-[var(--text-primary)]">{formatCurrency(item.estimatedAmount, currency)}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {formatCurrency(item.rate, currency)}/h
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Nenhuma sessao registada neste mes.</p>
          )}
        </Panel>
        ) : null}

        <Panel description="Ultimas sessoes registadas na tabela tempo_projeto." title="Historico recente">
          {recentSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    <th className="pb-2 pr-4 font-medium">Projeto</th>
                    <th className="pb-2 pr-4 font-medium">Inicio</th>
                    <th className="pb-2 pr-4 font-medium">Fim</th>
                    <th className="pb-2 pr-4 font-medium">Duracao</th>
                    <th className="pb-2 font-medium">Descricao</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => {
                    const duration =
                      session.duracao_min ??
                      Math.max(
                        Math.floor(
                          ((session.fim ? new Date(session.fim) : now).getTime() -
                            new Date(session.inicio).getTime()) /
                            60000,
                        ),
                        0,
                      )

                    return (
                      <tr key={session.id} className="text-sm">
                        <td className="rounded-l-2xl border-y border-l border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-primary)]">
                          {getSessionProjectTitle(session)}
                        </td>
                        <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-secondary)]">
                          {formatDate(session.inicio, {
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-secondary)]">
                          {session.fim
                            ? formatDate(session.fim, {
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : 'Em curso'}
                        </td>
                        <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-secondary)]">
                          {formatDurationMinutes(duration)}
                        </td>
                        <td className="rounded-r-2xl border-y border-r border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-[var(--text-muted)]">
                          {session.descricao || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Ainda nao ha sessoes registadas.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}

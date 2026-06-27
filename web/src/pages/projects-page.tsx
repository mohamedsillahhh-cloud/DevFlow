import { BriefcaseBusiness, Filter, PlusCircle, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { EmptyState } from '../components/ui/empty-state'
import { FullScreenLoader } from '../components/ui/full-screen-loader'
import { PageSectionNav } from '../components/layout/page-section-nav'
import { Panel } from '../components/ui/panel'
import { StatCard } from '../components/ui/stat-card'
import { StatusBadge } from '../components/ui/status-badge'
import { useAsyncData } from '../hooks/use-data'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  INPUT_BASE,
  TEXTAREA_BASE,
  deadlineColor,
  formatCurrency,
  formatDate,
  formatPercent,
  getClientName,
  parseDateValue,
  projectDueAmount,
} from '../lib/format'
import { getWorkspaceSection } from '../lib/navigation'
import { createProjeto, deleteProjeto, fetchProjectsSnapshot, updateProjetoStatus } from '../lib/data'

const STATUS_OPTIONS = [
  { label: 'Todos os status', value: 'todos' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Pago parcial', value: 'pago_parcial' },
  { label: 'Pago', value: 'pago' },
  { label: 'Concluido', value: 'concluido' },
  { label: 'Cancelado', value: 'cancelado' },
]

const PROJECT_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.value !== 'todos')

function scrollToProjectForm() {
  document.getElementById('project-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function getProjectStatusLabel(status: string) {
  return PROJECT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

export function ProjectsPage() {
  const location = useLocation()
  const { data, error, isLoading, reload } = useAsyncData(fetchProjectsSnapshot)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todos')
  const [form, setForm] = useState({
    clientName: '',
    deadline: '',
    description: '',
    notes: '',
    repoUrl: '',
    stagingUrl: '',
    status: 'pendente',
    title: '',
    totalValue: '',
    type: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)
  const deferredSearch = useDeferredValue(search)
  const section = getWorkspaceSection(location.pathname, '/projetos', 'overview')
  const sectionNavItems = [
    { label: 'Overview', to: '/projetos' },
    { label: 'Pipeline', to: '/projetos/pipeline' },
    { label: 'Novo projeto', to: '/projetos/novo' },
  ]

  if (isLoading && !data) {
    return <FullScreenLoader label="A carregar os projetos..." />
  }

  if (error || !data) {
    return (
      <Panel
        actions={
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            Tentar novamente
          </button>
        }
        description={error ?? 'Nao foi possivel carregar os projetos.'}
        title="Falha ao carregar"
      />
    )
  }

  const { configuracoes, projetos } = data
  const currency = configuracoes.moeda ?? 'CVE'
  const statusLabel = STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Todos os status'
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filteredProjects = projetos.filter((project) => {
    const searchTerm = deferredSearch.trim().toLowerCase()
    const clientName = getClientName(project).toLowerCase()
    const projectTitle = project.titulo.toLowerCase()
    const matchesSearch =
      searchTerm.length === 0 || clientName.includes(searchTerm) || projectTitle.includes(searchTerm)
    const matchesStatus = status === 'todos' || (project.status ?? '').toLowerCase() === status

    return matchesSearch && matchesStatus
  })

  const amountDue = filteredProjects.reduce(
    (accumulator, project) => accumulator + projectDueAmount(project),
    0,
  )
  const inProgress = filteredProjects.filter(
    (project) => (project.status ?? '').toLowerCase() === 'em_andamento',
  ).length
  const overdue = filteredProjects.filter((project) => {
    if (!project.prazo) {
      return false
    }
    const deadline = parseDateValue(project.prazo)
    deadline.setHours(0, 0, 0, 0)
    return (
      deadline < today &&
      !['concluido', 'cancelado', 'pago'].includes((project.status ?? '').toLowerCase())
    )
  }).length
  const paidProjects = projetos.filter((project) =>
    ['pago', 'concluido'].includes((project.status ?? '').toLowerCase()),
  ).length
  const activeFilters = [
    search.trim() ? `Pesquisa: ${search.trim()}` : null,
    status !== 'todos' ? `Status: ${statusLabel}` : null,
  ].filter((item): item is string => Boolean(item))

  const isDatabaseEmpty = projetos.length === 0
  const hasFilteredResults = filteredProjects.length > 0

  async function handleCreateProject() {
    setFeedback(null)
    setActionError(null)
    setIsSubmitting(true)

    try {
      await createProjeto({
        clientName: form.clientName,
        deadline: form.deadline,
        description: form.description,
        notes: form.notes,
        repoUrl: form.repoUrl,
        stagingUrl: form.stagingUrl,
        status: form.status,
        title: form.title,
        totalValue: form.totalValue ? Number(form.totalValue) : 0,
        type: form.type,
      })

      setForm({
        clientName: '',
        deadline: '',
        description: '',
        notes: '',
        repoUrl: '',
        stagingUrl: '',
        status: 'pendente',
        title: '',
        totalValue: '',
        type: '',
      })
      setFeedback('Projeto criado com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel criar o projeto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProject(projectId: number, projectTitle: string) {
    const shouldDelete = window.confirm(`Remover o projeto "${projectTitle}"? Esta acao apaga receitas e sessoes ligadas.`)
    if (!shouldDelete) {
      return
    }

    setFeedback(null)
    setActionError(null)
    setDeletingId(projectId)

    try {
      await deleteProjeto(projectId)
      setFeedback('Projeto removido com sucesso.')
      await reload()
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel remover o projeto.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleUpdateProjectStatus(projectId: number, currentStatus: string | null, nextStatus: string, projectTitle: string) {
    if ((currentStatus ?? 'pendente').toLowerCase() === nextStatus) {
      return
    }

    setFeedback(null)
    setActionError(null)
    setUpdatingStatusId(projectId)

    try {
      await updateProjetoStatus(projectId, nextStatus)
      setFeedback(`Status de "${projectTitle}" atualizado para ${getProjectStatusLabel(nextStatus)}.`)
      await reload()
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error ? caughtError.message : 'Nao foi possivel atualizar o status do projeto.',
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageSectionNav
        helper="Criacao, exploracao do pipeline e operacao do cadastro agora ficam em vistas separadas."
        items={sectionNavItems}
      />

      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-[1.05fr,0.95fr]">
        {section === 'novo' ? (
          <Panel
          actions={
            <button
              className={BUTTON_PRIMARY}
              disabled={isSubmitting}
              onClick={() => void handleCreateProject()}
              type="button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar projeto
            </button>
          }
          description="Regista um projeto novo sem sair desta pagina. O cliente e criado automaticamente se ainda nao existir."
          title="Novo projeto"
        >
          <div className="grid gap-4 md:grid-cols-2" id="project-form">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Cliente</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))}
                placeholder="Nome do cliente"
                type="text"
                value={form.clientName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Projeto</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex.: Website institucional"
                type="text"
                value={form.title}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Tipo</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                placeholder="Branding, web app, consultoria..."
                type="text"
                value={form.type}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Valor total</span>
              <input
                className={INPUT_BASE}
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, totalValue: event.target.value }))}
                placeholder="0"
                step="0.01"
                type="number"
                value={form.totalValue}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Status</span>
              <select
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                value={form.status}
              >
                {PROJECT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Prazo</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                type="date"
                value={form.deadline}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Repositorio</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, repoUrl: event.target.value }))}
                placeholder="https://github.com/..."
                type="url"
                value={form.repoUrl}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Staging</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, stagingUrl: event.target.value }))}
                placeholder="https://preview..."
                type="url"
                value={form.stagingUrl}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Descricao</span>
              <textarea
                className={TEXTAREA_BASE}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Escopo, entregas e contexto do projeto"
                value={form.description}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Notas internas</span>
              <textarea
                className={TEXTAREA_BASE}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Observacoes adicionais"
                value={form.notes}
              />
            </label>
          </div>

          {feedback ? <p className="mt-4 text-sm text-[var(--color-success)]">{feedback}</p> : null}
          {actionError ? <p className="mt-4 text-sm text-[var(--color-danger)]">{actionError}</p> : null}
          </Panel>
        ) : null}

        {['overview', 'pipeline'].includes(section) ? (
          <Panel
          actions={
            <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </button>
          }
          description="Pesquisa rapida, leitura do pipeline e filtros para encontrar gargalos."
          title="Explorar pipeline"
        >
          <div className="grid gap-3 md:grid-cols-[1fr,220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                className={`${INPUT_BASE} h-9 pl-9 text-xs`}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente ou projeto..."
                type="search"
                value={search}
              />
            </label>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <select
                className={`${INPUT_BASE} h-9 appearance-none pl-9 text-xs`}
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              {filteredProjects.length} resultado(s)
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Base total: {projetos.length}
            </div>
            {activeFilters.map((item) => (
              <div
                key={item}
                className="rounded-md border border-[var(--border-strong)] bg-[var(--surface-soft)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]"
              >
                {item}
              </div>
            ))}
          </div>
          </Panel>
        ) : null}
      </div>

      {['overview', 'pipeline'].includes(section) ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          accent="var(--color-accent-orange)"
          label="A receber"
          subtitle={`${filteredProjects.length} projetos filtrados`}
          value={formatCurrency(amountDue, currency)}
        />
        <StatCard
          accent="var(--color-accent-blue)"
          label="Em andamento"
          subtitle="pipeline ativo"
          value={String(inProgress)}
        />
        <StatCard
          accent="var(--color-accent-red)"
          label="Atrasados"
          subtitle="prazo vencido"
          value={String(overdue)}
        />
        <StatCard
          accent="var(--color-accent-green)"
          label="Concluidos"
          subtitle={`${projetos.length} projetos na base`}
          value={String(paidProjects)}
        />
        </div>
      ) : null}

      {section === 'pipeline' ? (
        <Panel
        description="Lista consolidada com cliente, status, progresso financeiro, prazo e limpeza rapida."
        title="Lista de projetos"
      >
        {hasFilteredResults ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2.5 text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  <th className="pb-2 pr-4 font-medium">Cliente</th>
                  <th className="pb-2 pr-4 font-medium">Projeto</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Total</th>
                  <th className="pb-2 pr-4 font-medium">Pago</th>
                  <th className="pb-2 pr-4 font-medium">%</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Prazo</th>
                  <th className="pb-2 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="text-sm text-[var(--text-primary)]">
                    <td className="rounded-l-2xl border-y border-l border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 text-[var(--text-secondary)]">
                      {getClientName(project)}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--text-primary)]">{project.titulo}</p>
                        {project.repo_url || project.staging_url ? (
                          <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                            {project.repo_url ? (
                              <a
                                className="transition hover:text-[var(--brand)]"
                                href={project.repo_url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Repositorio
                              </a>
                            ) : null}
                            {project.staging_url ? (
                              <a
                                className="transition hover:text-[var(--brand)]"
                                href={project.staging_url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Staging
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)]">Sem links externos associados.</p>
                        )}
                      </div>
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 text-[var(--text-secondary)]">
                      {project.tipo || '-'}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 text-[var(--text-secondary)]">
                      {formatCurrency(project.valor_total ?? 0, currency)}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 text-[var(--text-secondary)]">
                      {formatCurrency(project.valor_pago ?? 0, currency)}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 text-[var(--text-secondary)]">
                      {formatPercent(project.valor_pago ?? 0, project.valor_total ?? 0)}
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="border-y border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
                      <span style={{ color: deadlineColor(project.prazo) }}>{formatDate(project.prazo)}</span>
                    </td>
                    <td className="rounded-r-2xl border-y border-r border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
                      <div className="flex min-w-[170px] flex-col gap-2 lg:min-w-[210px]">
                        <select
                          className={`${INPUT_BASE} px-3 py-2 text-xs`}
                          disabled={deletingId === project.id || updatingStatusId === project.id}
                          onChange={(event) =>
                            void handleUpdateProjectStatus(project.id, project.status, event.target.value, project.titulo)
                          }
                          value={(project.status ?? 'pendente').toLowerCase()}
                        >
                          {PROJECT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          className={`${BUTTON_SECONDARY} px-3 py-2 text-xs`}
                          disabled={deletingId === project.id || updatingStatusId === project.id}
                          onClick={() => void handleDeleteProject(project.id, project.titulo)}
                          type="button"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Remover
                        </button>

                        {updatingStatusId === project.id ? (
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">A guardar status...</p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isDatabaseEmpty ? (
          <EmptyState
            action={
              <button className={BUTTON_PRIMARY} onClick={scrollToProjectForm} type="button">
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar primeiro projeto
              </button>
            }
            description="A base ainda esta vazia, mas agora ja podes abrir o primeiro projeto diretamente por aqui sem tocar no Supabase."
            icon={BriefcaseBusiness}
            tags={['Criacao direta', 'Cliente automatico', 'Sem dados falsos']}
            title="Nenhum projeto registado"
          />
        ) : (
          <EmptyState
            action={
              <button
                className={BUTTON_SECONDARY}
                onClick={() => {
                  setSearch('')
                  setStatus('todos')
                }}
                type="button"
              >
                Limpar filtros
              </button>
            }
            description="Existem projetos na base, mas os filtros atuais eliminaram todos os resultados. Remove a pesquisa ou volta para Todos os status."
            icon={Search}
            tags={activeFilters}
            title="Nenhum projeto encontrado"
          />
        )}
        </Panel>
      ) : null}
    </div>
  )
}

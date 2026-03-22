import { BriefcaseBusiness, Filter, PlusCircle, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { EmptyState } from '../components/empty-state'
import { FullScreenLoader } from '../components/full-screen-loader'
import { Panel } from '../components/panel'
import { StatCard } from '../components/stat-card'
import { StatusBadge } from '../components/status-badge'
import { useAsyncData } from '../hooks/use-async-data'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  INPUT_BASE,
  deadlineColor,
  formatCurrency,
  formatDate,
  formatPercent,
  getClientName,
  projectDueAmount,
} from '../lib/format'
import { createProjeto, deleteProjeto, fetchProjectsSnapshot } from '../lib/supabase-data'

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
const TEXTAREA_BASE = `${INPUT_BASE} min-h-[110px] resize-y`

function scrollToProjectForm() {
  document.getElementById('project-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ProjectsPage() {
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
  const deferredSearch = useDeferredValue(search)

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
    const deadline = new Date(project.prazo)
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 2xl:grid-cols-[1.05fr,0.95fr]">
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
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Cliente</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))}
                placeholder="Nome do cliente"
                type="text"
                value={form.clientName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Projeto</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex.: Website institucional"
                type="text"
                value={form.title}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Tipo</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                placeholder="Branding, web app, consultoria..."
                type="text"
                value={form.type}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Valor total</span>
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
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Status</span>
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
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Prazo</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                type="date"
                value={form.deadline}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Repositorio</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, repoUrl: event.target.value }))}
                placeholder="https://github.com/..."
                type="url"
                value={form.repoUrl}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Staging</span>
              <input
                className={INPUT_BASE}
                onChange={(event) => setForm((current) => ({ ...current, stagingUrl: event.target.value }))}
                placeholder="https://preview..."
                type="url"
                value={form.stagingUrl}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Descricao</span>
              <textarea
                className={TEXTAREA_BASE}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Escopo, entregas e contexto do projeto"
                value={form.description}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Notas internas</span>
              <textarea
                className={TEXTAREA_BASE}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Observacoes adicionais"
                value={form.notes}
              />
            </label>
          </div>

          {feedback ? <p className="mt-4 text-sm text-[#1d9e75]">{feedback}</p> : null}
          {actionError ? <p className="mt-4 text-sm text-[#e24b4a]">{actionError}</p> : null}
        </Panel>

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
          <div className="grid gap-3 xl:grid-cols-[1.2fr,260px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e5e66]" />
              <input
                className={`${INPUT_BASE} pl-11`}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente ou projeto..."
                type="search"
                value={search}
              />
            </label>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5e5e66]" />
              <select
                className={`${INPUT_BASE} appearance-none pl-11`}
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

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-[#232329] bg-[#0d0d10] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#76767f]">
              {filteredProjects.length} resultado(s)
            </div>
            <div className="rounded-full border border-[#232329] bg-[#0d0d10] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#76767f]">
              Base total: {projetos.length}
            </div>
            {activeFilters.map((item) => (
              <div
                key={item}
                className="rounded-full border border-[#3a161c] bg-[#14080b] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#e94560]"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          accent="#ef9f27"
          label="A receber"
          subtitle={`${filteredProjects.length} projetos filtrados`}
          value={formatCurrency(amountDue, currency)}
        />
        <StatCard
          accent="#378add"
          label="Em andamento"
          subtitle="pipeline ativo"
          value={String(inProgress)}
        />
        <StatCard
          accent="#e24b4a"
          label="Atrasados"
          subtitle="prazo vencido"
          value={String(overdue)}
        />
        <StatCard
          accent="#1d9e75"
          label="Concluidos"
          subtitle={`${projetos.length} projetos na base`}
          value={String(paidProjects)}
        />
      </div>

      <Panel
        description="Lista consolidada com cliente, status, progresso financeiro, prazo e limpeza rapida."
        title="Lista de projetos"
      >
        {hasFilteredResults ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2.5 text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.24em] text-[#6d6d75]">
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
                  <tr key={project.id} className="text-sm text-[#f0f0f0]">
                    <td className="rounded-l-[22px] border-y border-l border-[#1b1b20] bg-[#0a0a0c] px-4 py-4 text-[#8a8a93]">
                      {getClientName(project)}
                    </td>
                    <td className="border-y border-[#1b1b20] bg-[#0a0a0c] px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-[#f0f0f0]">{project.titulo}</p>
                        {project.repo_url || project.staging_url ? (
                          <div className="flex flex-wrap gap-3 text-xs text-[#66666d]">
                            {project.repo_url ? (
                              <a
                                className="transition hover:text-[#e94560]"
                                href={project.repo_url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Repositorio
                              </a>
                            ) : null}
                            {project.staging_url ? (
                              <a
                                className="transition hover:text-[#e94560]"
                                href={project.staging_url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Staging
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-xs text-[#5d5d65]">Sem links externos associados.</p>
                        )}
                      </div>
                    </td>
                    <td className="border-y border-[#1b1b20] bg-[#0a0a0c] px-4 py-4 text-[#8a8a93]">
                      {project.tipo || '-'}
                    </td>
                    <td className="border-y border-[#1b1b20] bg-[#0a0a0c] px-4 py-4 text-[#8a8a93]">
                      {formatCurrency(project.valor_total ?? 0, currency)}
                    </td>
                    <td className="border-y border-[#1b1b20] bg-[#0a0a0c] px-4 py-4 text-[#8a8a93]">
                      {formatCurrency(project.valor_pago ?? 0, currency)}
                    </td>
                    <td className="border-y border-[#1b1b20] bg-[#0a0a0c] px-4 py-4 text-[#8a8a93]">
                      {formatPercent(project.valor_pago ?? 0, project.valor_total ?? 0)}
                    </td>
                    <td className="border-y border-[#1b1b20] bg-[#0a0a0c] px-4 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="border-y border-[#1b1b20] bg-[#0a0a0c] px-4 py-4">
                      <span style={{ color: deadlineColor(project.prazo) }}>{formatDate(project.prazo)}</span>
                    </td>
                    <td className="rounded-r-[22px] border-y border-r border-[#1b1b20] bg-[#0a0a0c] px-4 py-4">
                      <button
                        className={`${BUTTON_SECONDARY} px-3 py-2 text-xs`}
                        disabled={deletingId === project.id}
                        onClick={() => void handleDeleteProject(project.id, project.titulo)}
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
    </div>
  )
}

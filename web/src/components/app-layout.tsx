import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Landmark,
  LogOut,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useAsyncData } from '../hooks/use-async-data'
import { getUserDisplayName } from '../lib/format'
import { fetchConfiguracoes } from '../lib/supabase-data'
import { BUTTON_SECONDARY } from '../lib/format'

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: BriefcaseBusiness, label: 'Projetos', path: '/projetos' },
  { icon: Wallet, label: 'Financas', path: '/financas' },
  { icon: Landmark, label: 'Investimentos', path: '/investimentos' },
  { icon: Clock3, label: 'Timer', path: '/timer' },
  { icon: Settings2, label: 'Config', path: '/config' },
]

const PAGE_TITLES: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  '/config': {
    eyebrow: 'Preferencias',
    subtitle: 'Ajustes pessoais, moeda e parametros do teu cockpit financeiro.',
    title: 'Configuracoes',
  },
  '/dashboard': {
    eyebrow: 'Visao geral',
    subtitle: 'KPIs, alertas, graficos e atalhos de exportacao para decidir rapido.',
    title: 'Dashboard',
  },
  '/financas': {
    eyebrow: 'Fluxo financeiro',
    subtitle: 'Lancamentos, recorrencias e leitura mensal pronta para Excel.',
    title: 'Financas',
  },
  '/investimentos': {
    eyebrow: 'Patrimonio',
    subtitle: 'Metas, movimentos e distribuicao dos ativos em tempo real.',
    title: 'Investimentos',
  },
  '/projetos': {
    eyebrow: 'Pipeline',
    subtitle: 'Estado dos projetos, prazos, cobranca e operacao do dia a dia.',
    title: 'Projetos',
  },
  '/timer': {
    eyebrow: 'Foco',
    subtitle: 'Sessoes, horas faturaveis e controlo operacional do tempo investido.',
    title: 'Timer de trabalho',
  },
}

export function AppLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const { data: configuracoes } = useAsyncData(fetchConfiguracoes)
  const heading = PAGE_TITLES[location.pathname] ?? PAGE_TITLES['/dashboard']
  const displayName = getUserDisplayName(configuracoes ?? { nome_usuario: '' }, user?.email)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_22%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <aside className="border-b border-[var(--border-subtle)] bg-[rgba(0,0,0,0.9)] px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-[295px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="rounded-[30px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(4,4,4,0.98))] p-5 shadow-[var(--shadow-panel)]">
            <div className="flex flex-col gap-4">
              <div>
                <div className="inline-flex rounded-full border border-[var(--border-strong)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--brand)]">
                  Business cockpit
                </div>
                <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                  DevFlow
                </h1>
                <p className="mt-2 max-w-[220px] text-sm leading-6 text-[var(--text-secondary)]">
                  Painel operacional para pipeline, caixa, investimentos e horas com leitura executiva.
                </p>
              </div>

              <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Sessao ativa</p>
                <p className="mt-2 break-words text-base font-semibold text-[var(--text-primary)]">{displayName}</p>
                <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{user?.email}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Auth lock
                </div>
                <p className="mt-2 text-sm text-[var(--text-primary)]">Acesso por um unico e-mail autorizado.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Theme
                </div>
                <p className="mt-2 text-sm text-[var(--text-primary)]">Dark mode fixo com foco em leitura rapida.</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-[24px] border px-4 py-3.5 transition duration-200',
                    isActive
                      ? 'border-[rgba(255,255,255,0.24)] bg-[linear-gradient(180deg,rgba(24,24,24,0.98),rgba(10,10,10,0.98))] text-[var(--text-primary)] shadow-[0_18px_42px_rgba(255,255,255,0.05)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgba(7,7,7,0.96)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                    modulo
                  </span>
                </div>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 lg:mb-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Fluxo</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Visual preto fixo, dados reais e blocos pensados para decisao e exportacao.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(0,0,0,0.94),rgba(0,0,0,0.78))] px-6 py-5 backdrop-blur lg:px-8">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{heading.eyebrow}</p>
                <h2 className="mt-3 text-[clamp(2.4rem,4vw,3.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-primary)]">
                  {heading.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{heading.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Protected
                </div>
                <div className="inline-flex max-w-[280px] items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-xs text-[var(--text-primary)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                  <span className="truncate">{displayName}</span>
                </div>
                <button
                  className={BUTTON_SECONDARY}
                  onClick={() => {
                    void signOut()
                  }}
                  type="button"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

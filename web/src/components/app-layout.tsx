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
    subtitle: 'Ajustes pessoais e parametros de alerta.',
    title: 'Configuracoes',
  },
  '/dashboard': {
    eyebrow: 'Visao geral',
    subtitle: 'Receitas, gastos, entregas e sinais de atencao.',
    title: 'Dashboard',
  },
  '/financas': {
    eyebrow: 'Fluxo financeiro',
    subtitle: 'Receitas, despesas e recorrencias do periodo.',
    title: 'Financas',
  },
  '/investimentos': {
    eyebrow: 'Patrimonio',
    subtitle: 'Metas de aporte, posicao atual e movimentos recentes.',
    title: 'Investimentos',
  },
  '/projetos': {
    eyebrow: 'Pipeline',
    subtitle: 'Estado dos projetos, valores pendentes e prazos.',
    title: 'Projetos',
  },
  '/timer': {
    eyebrow: 'Foco',
    subtitle: 'Sessao ativa, horas do mes e historico recente.',
    title: 'Timer de trabalho',
  },
}

export function AppLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const heading = PAGE_TITLES[location.pathname] ?? PAGE_TITLES['/dashboard']

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#000000] text-[#f0f0f0]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,69,96,0.16),transparent_24%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_18%),radial-gradient(circle_at_bottom_left,rgba(233,69,96,0.08),transparent_20%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <aside className="border-b border-[#141418] bg-[#040405]/88 px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-[290px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="rounded-[28px] border border-[#17171b] bg-[linear-gradient(180deg,rgba(12,12,14,0.96),rgba(7,7,8,0.96))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full border border-[#3a161c] bg-[#14080b] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[#e94560]">
                  Personal workspace
                </div>
                <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.05em] text-[#f0f0f0]">
                  DevFlow
                </h1>
                <p className="mt-2 max-w-[210px] text-sm leading-6 text-[#8a8a93]">
                  Workspace privado para pipeline, caixa, investimentos e tempo de execucao.
                </p>
              </div>
              <div className="rounded-2xl border border-[#1a1a20] bg-[#0c0c0f] px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#666666]">Sessao</p>
                <p className="mt-1 max-w-[112px] truncate text-xs text-[#f0f0f0]">{user?.email}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-[#17171b] bg-[#0a0a0c] px-3 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#777780]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#e94560]" />
                  Auth lock
                </div>
                <p className="mt-2 text-sm text-[#f0f0f0]">Acesso por um unico e-mail autorizado.</p>
              </div>
              <div className="rounded-2xl border border-[#17171b] bg-[#0a0a0c] px-3 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#777780]">
                  <Sparkles className="h-3.5 w-3.5 text-[#e94560]" />
                  Stack
                </div>
                <p className="mt-2 text-sm text-[#f0f0f0]">React, Tailwind e Supabase.</p>
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
                      ? 'border-[#47202a] bg-[linear-gradient(180deg,rgba(37,10,17,0.98),rgba(26,8,12,0.98))] text-[#f0f0f0] shadow-[0_16px_36px_rgba(233,69,96,0.08)]'
                      : 'border-[#17171b] bg-[#09090b] text-[#888891] hover:border-[#29292f] hover:bg-[#111114] hover:text-[#f0f0f0]',
                  ].join(' ')
                }
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#1f1f23] bg-[#050507]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[0.22em] text-[#66666d] group-hover:text-[#7c7c85]">
                    modulo
                  </span>
                </div>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-[24px] border border-[#17171b] bg-[#09090b] p-4 lg:mb-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#66666d]">Fluxo</p>
            <p className="mt-2 text-sm leading-6 text-[#8a8a93]">
              Workspace operavel com registos reais, leitura rapida e menos espaco morto.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#141418] bg-[linear-gradient(180deg,rgba(0,0,0,0.92),rgba(0,0,0,0.74))] px-6 py-5 backdrop-blur lg:px-8">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#66666d]">{heading.eyebrow}</p>
                <h2 className="mt-3 text-[clamp(2.4rem,4vw,3.8rem)] font-semibold tracking-[-0.06em] text-[#f0f0f0]">
                  {heading.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8a8a93]">{heading.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#1f1f24] bg-[#0c0c0f] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#777780]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#e94560]" />
                  Protected
                </div>
                <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-[#1f1f24] bg-[#0c0c0f] px-4 py-2 text-xs text-[#f0f0f0]">
                  <span className="h-2 w-2 rounded-full bg-[#e94560]" />
                  <span className="truncate">{user?.email}</span>
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

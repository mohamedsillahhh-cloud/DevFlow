import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Landmark,
  LogOut,
  Moon,
  Settings2,
  ShieldCheck,
  SunMedium,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useAsyncData } from '../hooks/use-async-data'
import { getUserDisplayName } from '../lib/format'
import { fetchConfiguracoes, saveConfiguracoes } from '../lib/supabase-data'
import { BUTTON_SECONDARY } from '../lib/format'

const NAV_ITEMS = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: BriefcaseBusiness, label: 'Projetos', path: '/projetos' },
  { icon: Wallet, label: 'Financas', path: '/financas' },
  { icon: Landmark, label: 'Investimentos', path: '/investimentos' },
  { icon: Clock3, label: 'Timer', path: '/timer' },
  { icon: Settings2, label: 'Config', path: '/config' },
]

const PAGE_TITLES = [
  {
    eyebrow: 'Preferencias',
    path: '/config',
    subtitle: 'Ajustes pessoais, moeda e parametros do teu cockpit financeiro.',
    title: 'Configuracoes',
  },
  {
    eyebrow: 'Visao geral',
    path: '/dashboard',
    subtitle: 'Resumo executivo, atalhos e leitura rapida do negocio.',
    title: 'Dashboard',
  },
  {
    eyebrow: 'Fluxo financeiro',
    path: '/financas',
    subtitle: 'Caixa, lancamentos, agenda e leitura anual em paginas separadas.',
    title: 'Financas',
  },
  {
    eyebrow: 'Patrimonio',
    path: '/investimentos',
    subtitle: 'Carteira, movimentos e metas organizados por tarefa.',
    title: 'Investimentos',
  },
  {
    eyebrow: 'Pipeline',
    path: '/projetos',
    subtitle: 'Criacao, filtro e acompanhamento de projetos sem sobrecarregar a mesma tela.',
    title: 'Projetos',
  },
  {
    eyebrow: 'Foco',
    path: '/timer',
    subtitle: 'Timer, faturacao e historico divididos por necessidade operacional.',
    title: 'Timer de trabalho',
  },
]

type ThemeMode = 'dark' | 'light'
const THEME_STORAGE_KEY = 'devflow-theme-mode'

export function AppLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const { data: configuracoes } = useAsyncData(fetchConfiguracoes)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })

  // Sincronizar tema com configuracoes quando carrega
  useEffect(() => {
    if (configuracoes?.tema) {
      const newTheme = configuracoes.tema === 'dark' ? 'dark' : 'light'
      setThemeState(newTheme)
    }
  }, [configuracoes?.tema])

  // Função para mudar tema e salvar na config
  const handleThemeChange = async (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    
    // Salvar na base de dados
    if (configuracoes) {
      try {
        await saveConfiguracoes({
          ...configuracoes,
          tema: newTheme,
        })
      } catch (error) {
        console.error('Erro ao salvar tema:', error)
      }
    }
  }
  const heading =
    PAGE_TITLES.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) ??
    PAGE_TITLES[1]
  const displayName = getUserDisplayName(configuracoes ?? { nome_usuario: '' }, user?.email)
  const isDark = theme === 'dark'

  // Aplicar tema ao documento quando theme muda
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.06),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_35%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row lg:gap-6 lg:px-4">
        <aside className="border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-[295px] lg:overflow-y-auto lg:rounded-2xl lg:border lg:px-5 lg:py-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,var(--surface-2),var(--surface-1))] p-5 shadow-[var(--shadow-panel)]">
            <div className="flex flex-col gap-5">
              <div>
                <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-medium text-[var(--brand)]">
                  Business cockpit
                </div>
                <h1 className="mt-4 text-[30px] font-semibold text-[var(--text-primary)]">
                  DevFlow
                </h1>
                <p className="mt-2 max-w-[220px] text-sm leading-6 text-[var(--text-secondary)]">
                  Painel operacional para pipeline, caixa, investimentos e horas com leitura executiva.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
                <p className="text-[11px] font-medium text-[var(--text-muted)]">Sessao ativa</p>
                <p className="mt-2 break-words text-base font-semibold text-[var(--text-primary)]">{displayName}</p>
                <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{user?.email}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Auth lock
                </div>
                <p className="mt-2 text-sm text-[var(--text-primary)]">Acesso por um unico e-mail autorizado.</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-xl border px-3 py-3 transition duration-200',
                    isActive
                      ? 'border-[var(--border-strong)] bg-[var(--inverted-surface)] text-[var(--inverted-text)] shadow-[var(--shadow-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <span
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)]',
                    'bg-[var(--surface-2)]',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                    modulo
                  </span>
                </div>
              </NavLink>
            ))}
          </nav>

          <p className="mt-5 px-1 text-xs text-[var(--text-muted)] lg:mb-4">
            Layout focado em leitura rapida, com prioridade para dados e acoes.
          </p>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,var(--surface-2),var(--surface-1))] px-6 py-5 backdrop-blur lg:px-8">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-muted)]">{heading.eyebrow}</p>
                <h2 className="mt-2 text-[clamp(1.8rem,3vw,2.8rem)] font-semibold text-[var(--text-primary)]">
                  {heading.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{heading.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                  className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]"
                  onClick={() => void handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                  type="button"
                >
                  {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-muted)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Protected
                </div>
                <div className="inline-flex max-w-[280px] items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)]">
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

          <main className="flex-1 px-6 py-6 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

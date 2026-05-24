import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Landmark,
  LogOut,
  Moon,
  Settings2,
  SunMedium,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useAsyncData } from '../hooks/use-async-data'
import { getUserDisplayName } from '../lib/format'
import { fetchConfiguracoes, saveConfiguracoes } from '../lib/supabase-data'

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
    if (configuracoes?.tema === 'dark' || configuracoes?.tema === 'light') {
      setThemeState(configuracoes.tema)
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

  const initials = displayName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row lg:px-4">
        <aside className="flex w-full flex-col border-b border-[var(--border-subtle)] bg-[#0D0D14] px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-[220px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-[var(--border-subtle)] lg:px-4 lg:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
              D
            </div>
            <span className="font-['Space_Grotesk',sans-serif] text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              DevFlow
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{displayName}</p>
              <p className="truncate text-[11px] text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'border-l-[3px] border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
                      : 'border-l-[3px] border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            onClick={() => void signOut()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Terminar sessao
          </button>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/90 px-6 py-4 backdrop-blur-md lg:px-8">
            <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">{heading.eyebrow}</p>
                <h2 className="mt-1 text-[32px] font-bold leading-tight tracking-tight text-[var(--text-primary)]" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                  {heading.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  onClick={() => void handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                  type="button"
                >
                  {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <span className="rounded-md bg-[var(--brand-soft)] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--brand)]">
                  Protected
                </span>
                <span className="max-w-[160px] truncate text-xs text-[var(--text-muted)]">{displayName}</span>
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

import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Landmark,
  Menu,
  Moon,
  Settings2,
  SunMedium,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAsyncData } from '../../hooks/use-async-data'
import { useNavigationShortcuts } from '../../hooks/use-keyboard-shortcuts'
import { fetchConfiguracoes, saveConfiguracoes } from '../../lib/supabase/supabase-data'

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
  const { data: configuracoes } = useAsyncData(fetchConfiguracoes)
  useNavigationShortcuts()
  const [storedTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })
  const [themeOverride, setThemeOverride] = useState<ThemeMode | null>(null)
  const configTheme =
    configuracoes?.tema === 'dark' || configuracoes?.tema === 'light' ? configuracoes.tema : null
  const theme = themeOverride ?? configTheme ?? storedTheme

  // Função para mudar tema e salvar na config
  const handleThemeChange = async (newTheme: ThemeMode) => {
    setThemeOverride(newTheme)
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
  const displayName = configuracoes?.nome_usuario?.trim() || 'DevFlow'
  const isDark = theme === 'dark'

  // Aplicar tema ao documento quando theme muda
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const [mobileMenuState, setMobileMenuState] = useState({
    open: false,
    pathname: location.pathname,
  })
  const mobileMenuOpen = mobileMenuState.open && mobileMenuState.pathname === location.pathname

  const initials = displayName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  const closeMobile = () => setMobileMenuState({ open: false, pathname: location.pathname })

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuState({ open: false, pathname: location.pathname })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen, location.pathname])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row lg:px-4">
        {/* Mobile top bar (logo + hamburger) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-[var(--inverted-text)]">
              D
            </div>
            <span className="font-['Space_Grotesk',sans-serif] text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              DevFlow
            </span>
          </div>
          <button
            aria-controls="app-sidebar"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegacao' : 'Abrir menu de navegacao'}
            className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            onClick={() => setMobileMenuState({ open: !mobileMenuOpen, pathname: location.pathname })}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile overlay backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={closeMobile}
          />
        )}

        {/* Sidebar drawer */}
        <aside
          id="app-sidebar"
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-[75vw] max-w-[280px] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-6 shadow-2xl transition-[transform,visibility] duration-300 ease-out lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[220px] lg:translate-x-0 lg:overflow-y-auto lg:border-r lg:border-[var(--border-subtle)] lg:px-4 lg:py-6 lg:shadow-none',
            mobileMenuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
          ].join(' ')}
        >
          {/* Logo + close on mobile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-[var(--inverted-text)]">
                D
              </div>
              <span className="font-['Space_Grotesk',sans-serif] text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                DevFlow
              </span>
            </div>
            <button
              aria-label="Fechar menu de navegacao"
              className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] lg:hidden"
              onClick={closeMobile}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{displayName}</p>
            </div>
          </div>

          <nav aria-label="Navegacao principal" className="mt-6 flex-1 space-y-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition',
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


        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-16 z-20 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/90 px-4 py-2 backdrop-blur-md md:px-6 md:py-3 lg:top-0 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)] md:text-[11px]">{heading.eyebrow}</p>
                <h2 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-xl md:text-2xl lg:text-[32px]" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                  {heading.title}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  onClick={() => void handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                  type="button"
                >
                  {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <span className="hidden truncate text-xs text-[var(--text-muted)] sm:inline max-w-[100px] md:max-w-[160px]">{displayName}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 py-3 md:px-6 md:py-6 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'

export function LoginPage() {
  const { clearNotice, configIssues, isAuthenticated, notice, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />
  }

  const visibleError = error ?? notice ?? configIssues[0] ?? null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    clearNotice()
    setIsSubmitting(true)

    try {
      await signIn(email, password)
    } catch (caughtError) {
      setError('E-mail ou senha incorretos. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-canvas)] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--brand-soft),transparent_60%)]" />

      <div className="relative w-[420px] max-w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-8 shadow-2xl shadow-black/5 backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)]">
          <LockKeyhole className="h-7 w-7 text-[var(--brand)]" />
        </div>

        <h1 className="text-center text-2xl font-semibold text-[var(--text-primary)]">DevFlow</h1>
        <p className="mt-1.5 text-center text-sm text-[var(--text-secondary)]">
          Acesso ao painel de gestao
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-xs font-medium text-[var(--text-secondary)]"
              htmlFor="email"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                id="email"
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error || notice) {
                    setError(null)
                    clearNotice()
                  }
                }}
                placeholder="seu@email.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-medium text-[var(--text-secondary)]"
              htmlFor="password"
            >
              Senha
            </label>
            <div className="relative">
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] py-3 pl-10 pr-11 text-sm text-[var(--text-primary)] transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                id="password"
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (error || notice) {
                    setError(null)
                    clearNotice()
                  }
                }}
                placeholder="sua senha"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand)]/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || configIssues.length > 0}
            type="submit"
          >
            {isSubmitting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
              </svg>
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>

          {visibleError ? (
            <p className="rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 px-4 py-3 text-center text-sm text-[var(--color-danger)]">
              {visibleError}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  )
}

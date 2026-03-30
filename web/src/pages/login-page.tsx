import { type FormEvent, useState } from 'react'
import { Chrome, LockKeyhole } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'

export function LoginPage() {
  const { allowedEmails, clearNotice, configIssues, isAuthenticated, notice, signIn, signInWithGoogle } =
    useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitMode, setSubmitMode] = useState<'google' | 'password' | null>(null)

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />
  }

  const visibleError = error ?? notice ?? configIssues[0] ?? null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    clearNotice()
    setSubmitMode('password')

    try {
      await signIn(email, password)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel entrar.')
      setSubmitMode(null)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    clearNotice()
    setSubmitMode('google')

    try {
      await signInWithGoogle()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Nao foi possivel entrar com Google.')
      setSubmitMode(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] px-4">
      <div className="w-[460px] max-w-full rounded-[28px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(3,3,3,0.98))] p-8 shadow-[var(--shadow-panel)]">
        <div className="inline-flex rounded-full border border-[var(--border-strong)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--brand)]">
          Dark workspace
        </div>
        <h1 className="mt-5 text-[30px] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">DevFlow</h1>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">Acesso pessoal ao painel de gestao</p>

        <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Contas autorizadas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allowedEmails.map((allowedEmail) => (
              <span
                key={allowedEmail}
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-3)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
              >
                {allowedEmail}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitMode !== null || configIssues.length > 0}
            onClick={() => void handleGoogleSignIn()}
            type="button"
          >
            <Chrome className="h-4 w-4" />
            Continuar com Google
          </button>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            Se esta conta foi criada com Google, entra pelo botao acima.
          </p>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            ou entra com senha
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] transition focus:border-[var(--border-strong)] focus:ring-4 focus:ring-[var(--brand-soft)]"
              id="email"
              onChange={(event) => {
                setEmail(event.target.value)
                if (error || notice) {
                  setError(null)
                  clearNotice()
                }
              }}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text-primary)] transition focus:border-[var(--border-strong)] focus:ring-4 focus:ring-[var(--brand-soft)]"
              id="password"
              onChange={(event) => {
                setPassword(event.target.value)
                if (error || notice) {
                  setError(null)
                  clearNotice()
                }
              }}
              required
              type="password"
              value={password}
            />
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.42)] bg-[linear-gradient(180deg,#ffffff,#dcdcdc)] px-4 py-3 font-medium text-[#050505] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitMode !== null || configIssues.length > 0}
            type="submit"
          >
            <LockKeyhole className="h-4 w-4" />
            Entrar
          </button>

          {visibleError ? (
            <p className="min-h-[20px] text-sm text-[var(--color-danger)]">{visibleError}</p>
          ) : (
            <div className="min-h-[20px]" />
          )}
        </form>
      </div>
    </div>
  )
}

import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'

export function LoginPage() {
  const { configIssues, isAuthenticated, notice, clearNotice, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
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
      setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] px-4">
      <div className="w-[380px] max-w-full rounded-[12px] border border-[#222222] bg-[#0d0d0d] p-8 shadow-glow">
        <h1 className="text-[24px] font-medium text-[#f0f0f0]">DevFlow</h1>
        <p className="mb-7 mt-1 text-[13px] text-[#888888]">Acesso pessoal</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-[#888888]"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-[6px] border border-[#222222] bg-[#111111] px-[10px] py-[10px] text-[#f0f0f0] transition focus:border-[#e94560]"
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
              className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-[#888888]"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-[6px] border border-[#222222] bg-[#111111] px-[10px] py-[10px] text-[#f0f0f0] transition focus:border-[#e94560]"
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
            className="w-full rounded-[6px] bg-[#e94560] px-4 py-[11px] font-medium text-white transition hover:bg-[#f25c74] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || configIssues.length > 0}
            type="submit"
          >
            Entrar
          </button>

          {visibleError ? (
            <p className="min-h-[20px] text-sm text-[#e24b4a]">{visibleError}</p>
          ) : (
            <div className="min-h-[20px]" />
          )}
        </form>
      </div>
    </div>
  )
}

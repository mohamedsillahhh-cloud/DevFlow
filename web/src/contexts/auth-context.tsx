import { type PropsWithChildren, startTransition, useEffect, useEffectEvent, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { appConfig, configIssues, hasSupabaseConfig, isAllowedEmail } from '../lib/app-config'
import { supabase } from '../lib/supabase'
import { type AuthContextValue, AuthContext } from './auth-context-store'

const INVALID_LOGIN_MESSAGES = new Set(['Invalid login credentials', 'Invalid grant'])

const NETWORK_ERROR_PATTERNS = [
  'Failed to fetch',
  'Load failed',
  'NetworkError',
  'fetch',
]

function mapAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'

  if (message === 'Email not confirmed') {
    return 'O e-mail ainda nao foi confirmado. Confirma a conta no Supabase e tenta novamente.'
  }

  if (INVALID_LOGIN_MESSAGES.has(message)) {
    return 'E-mail ou senha invalidos. Se esta conta foi criada com Google, entra com Google ou redefine a senha.'
  }

  if (NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'Nao foi possivel ligar ao Supabase. Verifica a URL do projeto e a internet.'
  }

  return message
}

function assertAllowedEmail(email: string | null | undefined) {
  if (!isAllowedEmail(email)) {
    throw new Error('Esta conta nao esta autorizada a entrar.')
  }
}

async function assertSupabaseReachable() {
  const response = await fetch(`${appConfig.supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: appConfig.supabaseAnonKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase auth respondeu com status ${response.status}.`)
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig)

  const applySession = useEffectEvent((nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null

    if (nextUser && !isAllowedEmail(nextUser.email)) {
      startTransition(() => {
        setNotice('Acesso nao autorizado')
        setSession(null)
        setUser(null)
        setIsLoading(false)
      })
      void supabase.auth.signOut()
      return
    }

    startTransition(() => {
      setSession(nextSession)
      setUser(nextUser)
      setIsLoading(false)
    })
  })

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setIsLoading(false)
      return
    }

    let active = true
    const loadingTimeout = window.setTimeout(() => {
      if (!active) {
        return
      }

      startTransition(() => {
        setNotice('A validacao da sessao demorou demasiado. Tenta recarregar a pagina.')
        setIsLoading(false)
      })
    }, 5000)

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active) {
          return
        }

        if (error) {
          startTransition(() => {
            setNotice(mapAuthErrorMessage(error))
            setIsLoading(false)
          })
          return
        }

        applySession(data.session)
      } catch (caughtError) {
        if (!active) {
          return
        }

        startTransition(() => {
          setNotice(mapAuthErrorMessage(caughtError))
          setIsLoading(false)
        })
      } finally {
        window.clearTimeout(loadingTimeout)
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession)
    })

    return () => {
      active = false
      window.clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      allowedEmails: appConfig.allowedEmails,
      clearNotice: () => setNotice(null),
      configIssues,
      isAuthenticated: Boolean(user),
      isLoading,
      notice,
      session,
      signIn: async (email: string, password: string) => {
        setNotice(null)

        if (configIssues.length > 0) {
          throw new Error(configIssues[0])
        }

        await assertSupabaseReachable()
        assertAllowedEmail(email)

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          throw new Error(mapAuthErrorMessage(error))
        }

        const nextUser = data.user ?? data.session?.user ?? null
        if (!nextUser) {
          throw new Error('Nao foi possivel validar o utilizador.')
        }

        try {
          assertAllowedEmail(nextUser.email)
        } catch (validationError) {
          await supabase.auth.signOut()
          setNotice('Acesso nao autorizado')
          throw validationError
        }

        startTransition(() => {
          setSession(data.session ?? null)
          setUser(nextUser)
        })
      },
      signInWithGoogle: async () => {
        setNotice(null)

        if (configIssues.length > 0) {
          throw new Error(configIssues[0])
        }

        await assertSupabaseReachable()
        const { data, error } = await supabase.auth.signInWithOAuth({
          options: {
            queryParams: {
              prompt: 'select_account',
            },
            redirectTo: `${window.location.origin}/login`,
          },
          provider: 'google',
        })

        if (error) {
          throw new Error(mapAuthErrorMessage(error))
        }

        if (!data.url) {
          throw new Error('Nao foi possivel iniciar o login com Google.')
        }
      },
      signOut: async () => {
        await supabase.auth.signOut()
        startTransition(() => {
          setSession(null)
          setUser(null)
        })
      },
      updatePassword: async (password: string) => {
        const normalizedPassword = password.trim()

        if (!user) {
          throw new Error('Sessao invalida. Faz login novamente.')
        }

        if (!normalizedPassword) {
          throw new Error('Informe a nova senha.')
        }

        const { data, error } = await supabase.auth.updateUser({
          password: normalizedPassword,
        })

        if (error) {
          throw new Error(mapAuthErrorMessage(error))
        }

        startTransition(() => {
          setUser(data.user ?? user)
        })
      },
      user,
    }),
    [isLoading, notice, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

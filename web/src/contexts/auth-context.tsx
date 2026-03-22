import { type PropsWithChildren, startTransition, useEffect, useEffectEvent, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { configIssues, hasSupabaseConfig, isAllowedEmail } from '../lib/app-config'
import { supabase } from '../lib/supabase'
import { type AuthContextValue, AuthContext } from './auth-context-store'

const INVALID_LOGIN_MESSAGES = new Set([
  'Email not confirmed',
  'Invalid login credentials',
  'Invalid grant',
])

function mapAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  if (INVALID_LOGIN_MESSAGES.has(message)) {
    return 'E-mail ou senha inválidos.'
  }
  return message
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig)

  const applySession = useEffectEvent(async (nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null

    if (nextUser && !isAllowedEmail(nextUser.email)) {
      await supabase.auth.signOut()
      startTransition(() => {
        setNotice('Acesso não autorizado')
        setSession(null)
        setUser(null)
        setIsLoading(false)
      })
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
      return
    }

    let active = true

    void (async () => {
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

      await applySession(data.session)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      allowedEmail: import.meta.env.VITE_ALLOWED_EMAIL?.trim().toLowerCase() ?? '',
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

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          throw new Error(mapAuthErrorMessage(error))
        }

        const nextUser = data.user ?? data.session?.user ?? null
        if (!nextUser || !isAllowedEmail(nextUser.email)) {
          await supabase.auth.signOut()
          setNotice('Acesso não autorizado')
          throw new Error('Acesso não autorizado')
        }

        startTransition(() => {
          setSession(data.session ?? null)
          setUser(nextUser)
        })
      },
      signOut: async () => {
        await supabase.auth.signOut()
        startTransition(() => {
          setSession(null)
          setUser(null)
        })
      },
      user,
    }),
    [isLoading, notice, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

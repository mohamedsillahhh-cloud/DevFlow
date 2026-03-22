import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthContextValue {
  allowedEmail: string
  clearNotice: () => void
  configIssues: string[]
  isAuthenticated: boolean
  isLoading: boolean
  notice: string | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  user: User | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

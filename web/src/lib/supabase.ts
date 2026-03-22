import { createClient } from '@supabase/supabase-js'
import { appConfig } from './app-config'

const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_KEY = 'placeholder-anon-key'

export const supabase = createClient(
  appConfig.supabaseUrl || FALLBACK_URL,
  appConfig.supabaseAnonKey || FALLBACK_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
)

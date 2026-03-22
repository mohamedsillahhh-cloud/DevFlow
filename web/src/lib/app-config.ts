const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const resolveValue = (...values: Array<string | null | undefined>) =>
  values.find((value) => Boolean(value?.trim()))?.trim() ?? ''

export const appConfig = {
  allowedEmail: normalizeEmail(import.meta.env.VITE_ALLOWED_EMAIL),
  supabaseAnonKey: resolveValue(
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.SUPABASE_KEY,
  ),
  supabaseUrl: resolveValue(import.meta.env.VITE_SUPABASE_URL, import.meta.env.SUPABASE_URL),
}

export const configIssues = [
  !appConfig.supabaseUrl ? 'Configure SUPABASE_URL ou VITE_SUPABASE_URL.' : null,
  !appConfig.supabaseAnonKey ? 'Configure SUPABASE_KEY ou VITE_SUPABASE_ANON_KEY.' : null,
  !appConfig.allowedEmail ? 'Configure VITE_ALLOWED_EMAIL antes de entrar.' : null,
].filter((issue): issue is string => Boolean(issue))

export const hasSupabaseConfig = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey)

export const isAllowedEmail = (email: string | null | undefined) =>
  Boolean(appConfig.allowedEmail) && normalizeEmail(email) === appConfig.allowedEmail

/**
 * Centralised env validation.
 * Called at module load time so missing vars cause a clear error at startup,
 * not a cryptic failure at runtime.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Add it to .env.local (development) or Vercel Environment Variables (production).`
    )
  }
  return value
}

export const env = {
  supabaseUrl:         requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:     requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey:  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  resendApiKey:        requireEnv('RESEND_API_KEY'),
} as const

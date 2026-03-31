/**
 * Centralised env validation.
 * NEXT_PUBLIC_ vars must be accessed with literal dot notation so
 * Next.js/webpack can inline them at build time.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Add it to .env.local (development) or Vercel Environment Variables (production).`
    )
  }
  return value
}

export const env = {
  supabaseUrl:        requireEnv('NEXT_PUBLIC_SUPABASE_URL',    process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey:    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY',   process.env.SUPABASE_SERVICE_ROLE_KEY),
  resendApiKey:       requireEnv('RESEND_API_KEY',              process.env.RESEND_API_KEY),
} as const

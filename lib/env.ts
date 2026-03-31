/**
 * Centralised env access.
 * Values are read lazily so module initialisation during Next.js "Collecting
 * page data" does NOT throw — the error surfaces on the first actual request
 * if a variable is missing.
 */

function get(name: string): string {
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
  get supabaseUrl()        { return get('NEXT_PUBLIC_SUPABASE_URL') },
  get supabaseAnonKey()    { return get('NEXT_PUBLIC_SUPABASE_ANON_KEY') },
  get supabaseServiceKey() { return get('SUPABASE_SERVICE_ROLE_KEY') },
  get resendApiKey()       { return get('RESEND_API_KEY') },
} as const

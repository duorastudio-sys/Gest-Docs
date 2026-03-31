import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email no válido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email: email.toLowerCase().trim() })

  if (error) {
    // Unique constraint = already registered
    if (error.code === '23505') {
      return NextResponse.json({ ok: true })
    }
    console.error('[api/waitlist] insert error:', error)
    return NextResponse.json({ error: 'Error al guardar el email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

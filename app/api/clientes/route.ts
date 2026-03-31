import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { nombre, email, telefono } = await req.json()
  if (!nombre || !email) {
    return NextResponse.json({ error: 'Nombre y email son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cliente')
    .insert({ gestoria_id: user.id, nombre, email, telefono: telefono ?? null })
    .select('id, token_acceso')
    .single()

  if (error) {
    console.error('[api/clientes] insert error:', error)
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

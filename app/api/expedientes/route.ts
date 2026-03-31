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

  const { clienteId, nombre, periodo } = await req.json()
  if (!clienteId || !nombre || !periodo) {
    return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
  }

  // Verify the client belongs to this gestoria (RLS enforces it, but let's be explicit)
  const { data: cliente } = await supabase
    .from('cliente')
    .select('id')
    .eq('id', clienteId)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('expediente')
    .insert({ cliente_id: clienteId, nombre, periodo })
    .select('id, nombre, periodo, estado')
    .single()

  if (error) {
    console.error('[api/expedientes] insert error:', error)
    return NextResponse.json({ error: 'Error al crear el expediente' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

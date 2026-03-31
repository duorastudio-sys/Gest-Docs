import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { enviarRecordatorio } from '@/lib/emails'

interface RouteParams {
  params: { expediente_id: string }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Auth check
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { expediente_id } = params

  // Fetch expediente + client + gestoria name
  const { data: expediente } = await supabaseAdmin
    .from('expediente')
    .select(`
      id, nombre, periodo,
      cliente (
        id, nombre, email, token_acceso, gestoria_id,
        gestoria ( nombre )
      ),
      requerimiento ( tipo_documento, obligatorio, estado )
    `)
    .eq('id', expediente_id)
    .single()

  if (!expediente) {
    return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
  }

  const cliente = expediente.cliente as any
  const gestoria = cliente.gestoria as any

  // Verify ownership
  if (cliente.gestoria_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const pendientes = (expediente.requerimiento as any[]).filter(
    r => r.estado === 'pendiente',
  )

  if (pendientes.length === 0) {
    return NextResponse.json(
      { error: 'El expediente no tiene requerimientos pendientes' },
      { status: 400 },
    )
  }

  const portalUrl = `${new URL(req.url).origin}/portal/${cliente.token_acceso}`

  const { error: emailError } = await enviarRecordatorio({
    clienteEmail: cliente.email,
    clienteNombre: cliente.nombre,
    gestoriaNombre: gestoria?.nombre ?? 'Tu gestoría',
    expedienteNombre: expediente.nombre,
    expedientePeriodo: expediente.periodo,
    pendientes,
    portalUrl,
  })

  if (emailError) {
    console.error('[api/recordatorio] resend error:', emailError)
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }

  // Save timestamp of last reminder
  await supabaseAdmin
    .from('expediente')
    .update({ ultimo_recordatorio: new Date().toISOString() })
    .eq('id', expediente_id)

  return NextResponse.json({ ok: true })
}

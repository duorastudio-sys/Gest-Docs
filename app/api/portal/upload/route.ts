import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { clasificarDocumento } from '@/lib/clasificador'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const clienteId = formData.get('clienteId') as string | null
  const expedienteId = formData.get('expedienteId') as string | null
  const token = formData.get('token') as string | null

  if (!file || !clienteId || !expedienteId || !token) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  // Validate token belongs to this client
  const { data: cliente, error: clienteError } = await supabaseAdmin
    .from('cliente')
    .select('id')
    .eq('token_acceso', token)
    .eq('id', clienteId)
    .single()

  if (clienteError || !cliente) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  // Validate expediente belongs to this client and is still pending
  const { data: expediente, error: expError } = await supabaseAdmin
    .from('expediente')
    .select('id')
    .eq('id', expedienteId)
    .eq('cliente_id', clienteId)
    .eq('estado', 'pendiente')
    .single()

  if (expError || !expediente) {
    return NextResponse.json({ error: 'Expediente no válido' }, { status: 401 })
  }

  // Upload to storage
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const storagePath = `clientes/${clienteId}/${expedienteId}/${timestamp}_${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: storageError } = await supabaseAdmin.storage
    .from('documentos')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (storageError) {
    console.error('[portal/upload] storage error:', storageError)
    return NextResponse.json({ error: 'Error al guardar el archivo' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('documentos')
    .getPublicUrl(storagePath)

  // Classify document by filename
  const tipo = clasificarDocumento(file.name)

  // Insert documento record with classified type
  const { data: doc, error: docError } = await supabaseAdmin
    .from('documento')
    .insert({ expediente_id: expedienteId, nombre_archivo: file.name, tipo, url_storage: publicUrl })
    .select('id')
    .single()

  if (docError || !doc) {
    console.error('[portal/upload] document insert error:', docError)
    await supabaseAdmin.storage.from('documentos').remove([storagePath])
    return NextResponse.json({ error: 'Error al registrar el documento' }, { status: 500 })
  }

  // If classified as something specific, try to cover a matching pending requerimiento
  if (tipo !== 'otro') {
    const { data: req } = await supabaseAdmin
      .from('requerimiento')
      .select('id')
      .eq('expediente_id', expedienteId)
      .eq('tipo_documento', tipo)
      .eq('estado', 'pendiente')
      .limit(1)
      .maybeSingle()

    if (req) {
      // Mark requerimiento as recibido — the DB trigger handles expediente completion
      await supabaseAdmin
        .from('requerimiento')
        .update({ estado: 'recibido' })
        .eq('id', req.id)
    }
  }

  return NextResponse.json({ ok: true, tipo })
}

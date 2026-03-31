import { supabaseAdmin } from '@/lib/supabase/admin'
import UploadZone from './UploadZone'

interface PageProps {
  params: { token: string }
}

const TIPO_LABELS: Record<string, string> = {
  factura: 'Factura',
  dni: 'DNI / Identificación',
  modelo_fiscal: 'Modelo fiscal',
  otro: 'Otro documento',
}

export default async function PortalPage({ params }: PageProps) {
  const { token } = params

  const { data: cliente, error: clienteError } = await supabaseAdmin
    .from('cliente')
    .select('id, nombre, email')
    .eq('token_acceso', token)
    .single()

  if (clienteError || !cliente) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-semibold text-gray-800">Enlace no válido</h1>
          <p className="text-gray-500 mt-2 text-sm">Este enlace no existe o ha caducado.</p>
        </div>
      </main>
    )
  }

  const { data: expediente } = await supabaseAdmin
    .from('expediente')
    .select('id, nombre, periodo, estado')
    .eq('cliente_id', cliente.id)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!expediente) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-semibold text-gray-800">Hola, {cliente.nombre}</h1>
          <p className="text-gray-500 mt-2 text-sm">No tienes ningún expediente pendiente en este momento.</p>
        </div>
      </main>
    )
  }

  const { data: requerimientos } = await supabaseAdmin
    .from('requerimiento')
    .select('id, tipo_documento, obligatorio, estado')
    .eq('expediente_id', expediente.id)
    .order('obligatorio', { ascending: false })

  const { data: documentos } = await supabaseAdmin
    .from('documento')
    .select('id, nombre_archivo, subido_at')
    .eq('expediente_id', expediente.id)
    .order('subido_at', { ascending: false })

  const pendientes = requerimientos?.filter(r => r.estado === 'pendiente') ?? []
  const recibidos = requerimientos?.filter(r => r.estado === 'recibido') ?? []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8 pb-16">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Portal de documentación</p>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {cliente.nombre} 👋</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {expediente.nombre} · {expediente.periodo}
          </p>
        </div>

        {/* Documentos pendientes */}
        {pendientes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Necesitamos que envíes
            </h2>
            <ul className="space-y-2">
              {pendientes.map(req => (
                <li
                  key={req.id}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${req.obligatorio ? 'bg-orange-400' : 'bg-yellow-300'}`} />
                  <span className="text-gray-800 text-sm flex-1">
                    {TIPO_LABELS[req.tipo_documento] ?? req.tipo_documento}
                  </span>
                  {req.obligatorio && (
                    <span className="text-xs text-orange-500 font-medium">Obligatorio</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Zona de subida */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Subir documentos
          </h2>
          <UploadZone
            clienteId={cliente.id}
            expedienteId={expediente.id}
            token={token}
          />
        </section>

        {/* Documentos ya subidos */}
        {(documentos?.length ?? 0) > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Archivos enviados
            </h2>
            <ul className="space-y-2">
              {documentos!.map(doc => (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm"
                >
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span className="text-gray-700 text-sm truncate flex-1">{doc.nombre_archivo}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Requerimientos ya recibidos */}
        {recibidos.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Ya recibidos
            </h2>
            <ul className="space-y-2">
              {recibidos.map(req => (
                <li
                  key={req.id}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm opacity-60"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-gray-500 text-sm flex-1">
                    {TIPO_LABELS[req.tipo_documento] ?? req.tipo_documento}
                  </span>
                  <span className="text-xs text-green-600 font-medium">Recibido</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}

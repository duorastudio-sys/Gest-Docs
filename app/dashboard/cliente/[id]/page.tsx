import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import RecordatorioBtn from './RecordatorioBtn'
import NuevoExpedienteForm from './NuevoExpedienteForm'

interface PageProps {
  params: { id: string }
}

const TIPO_LABELS: Record<string, string> = {
  factura: 'Factura',
  dni: 'DNI / Identificación',
  modelo_fiscal: 'Modelo fiscal',
  otro: 'Otro',
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'text-amber-700 bg-amber-50 border-amber-200',
  completo:  'text-green-700 bg-green-50 border-green-200',
}

export default async function ClienteDetallePage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: cliente } = await supabase
    .from('cliente')
    .select(`
      id, nombre, email, telefono, token_acceso,
      expediente (
        id, nombre, periodo, estado, ultimo_recordatorio,
        documento ( id, nombre_archivo, tipo, subido_at ),
        requerimiento ( id, tipo_documento, obligatorio, estado )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!cliente) notFound()

  const expedientes = (cliente.expediente as any[]) ?? []
  const portalUrl = `/portal/${cliente.token_acceso}`

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Clientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{cliente.nombre}</h1>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
          <p className="text-gray-800">{cliente.email}</p>
        </div>
        {cliente.telefono && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Teléfono</p>
            <p className="text-gray-800">{cliente.telefono}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Portal del cliente</p>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            Ver portal →
          </a>
        </div>
      </div>

      {/* Expedientes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Expedientes</h2>
        <NuevoExpedienteForm clienteId={cliente.id} />
      </div>

      {expedientes.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No hay expedientes aún.</p>
      ) : (
        <div className="space-y-4">
          {expedientes.map((exp: any) => {
            const docs = (exp.documento ?? []) as any[]
            const reqs = (exp.requerimiento ?? []) as any[]
            const reqsPendientes = reqs.filter((r: any) => r.estado === 'pendiente')
            const reqsRecibidos = reqs.filter((r: any) => r.estado === 'recibido')

            return (
              <div key={exp.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Expediente header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">{exp.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{exp.periodo}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ESTADO_BADGE[exp.estado] ?? ''}`}>
                      {exp.estado === 'completo' ? '✅ Completo' : '⚠️ Pendiente'}
                    </span>
                    {reqsPendientes.length > 0 && (
                      <RecordatorioBtn
                        expedienteId={exp.id}
                        ultimoRecordatorio={exp.ultimo_recordatorio}
                      />
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Documentos subidos */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Documentos subidos ({docs.length})
                    </p>
                    {docs.length === 0 ? (
                      <p className="text-sm text-gray-400">Ninguno todavía</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {docs.map((doc: any) => (
                          <li key={doc.id} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-gray-400">📄</span>
                            <span className="truncate">{doc.nombre_archivo}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Requerimientos */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Requerimientos
                    </p>
                    {reqs.length === 0 ? (
                      <p className="text-sm text-gray-400">Sin requerimientos definidos</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {reqsRecibidos.map((r: any) => (
                          <li key={r.id} className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="text-green-500">✓</span>
                            <span className="line-through">{TIPO_LABELS[r.tipo_documento] ?? r.tipo_documento}</span>
                          </li>
                        ))}
                        {reqsPendientes.map((r: any) => (
                          <li key={r.id} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.obligatorio ? 'bg-red-400' : 'bg-yellow-400'}`} />
                            <span>{TIPO_LABELS[r.tipo_documento] ?? r.tipo_documento}</span>
                            {r.obligatorio && <span className="text-xs text-red-500 ml-auto">Obligatorio</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

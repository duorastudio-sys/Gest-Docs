import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

type Estado = 'completo' | 'faltan_docs' | 'sin_actividad'

function getEstado(expedientes: { estado: string }[]): Estado {
  if (expedientes.length === 0) return 'sin_actividad'
  if (expedientes.every(e => e.estado === 'completo')) return 'completo'
  return 'faltan_docs'
}

const ESTADO_UI: Record<Estado, { icon: string; label: string; clases: string }> = {
  completo:       { icon: '✅', label: 'Completo',       clases: 'text-green-700 bg-green-50 border-green-200' },
  faltan_docs:    { icon: '⚠️', label: 'Faltan docs',    clases: 'text-amber-700 bg-amber-50 border-amber-200' },
  sin_actividad:  { icon: '🕐', label: 'Sin actividad',  clases: 'text-gray-500 bg-gray-100 border-gray-200' },
}

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: clientes } = await supabase
    .from('cliente')
    .select('id, nombre, email, expediente(id, estado)')
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link
          href="/dashboard/cliente/nuevo"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      {!clientes?.length ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Aún no tienes clientes</p>
          <Link href="/dashboard/cliente/nuevo" className="text-blue-600 mt-2 inline-block text-sm hover:underline">
            Añadir el primero →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {clientes.map(cliente => {
            const expedientes = (cliente.expediente as { estado: string }[]) ?? []
            const estado = getEstado(expedientes)
            const ui = ESTADO_UI[estado]

            return (
              <li key={cliente.id}>
                <Link
                  href={`/dashboard/cliente/${cliente.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl px-5 py-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cliente.nombre}</p>
                    <p className="text-sm text-gray-500 truncate">{cliente.email}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border flex-shrink-0 ${ui.clases}`}>
                    <span>{ui.icon}</span>
                    <span>{ui.label}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

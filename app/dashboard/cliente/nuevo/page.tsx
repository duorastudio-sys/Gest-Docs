import Link from 'next/link'
import NuevoClienteForm from './NuevoClienteForm'

export default function NuevoClientePage() {
  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Clientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nuevo cliente</h1>
      </div>
      <div className="max-w-md">
        <NuevoClienteForm />
      </div>
    </>
  )
}

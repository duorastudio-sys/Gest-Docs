import type { Metadata } from 'next'
import AccessForm from './AccessForm'

export const metadata: Metadata = {
  title: 'Gest Docs — Gestión documental para gestorías',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900 tracking-tight">Gest Docs</span>
        <a
          href="/login"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Área de gestoría →
        </a>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center">
          <span className="inline-block text-xs font-semibold tracking-widest text-blue-600 uppercase mb-5">
            Para gestorías y asesorías
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Tus clientes te envían<br className="hidden sm:block" /> los documentos en un clic
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Cada cliente tiene su propio portal. Tú defines qué necesitas,
            ellos lo suben desde el móvil. Sin emails, sin confusiones.
          </p>

          {/* Feature bullets */}
          <ul className="flex flex-col sm:flex-row gap-4 justify-center mb-12 text-sm text-gray-600">
            {[
              '📂 Portal personalizado por cliente',
              '🔔 Recordatorios por email',
              '🤖 Clasificación automática',
            ].map(f => (
              <li
                key={f}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center"
              >
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md mx-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Solicitar acceso
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Estamos en fase beta. Déjanos tu email y te avisamos cuando esté listo.
            </p>
            <AccessForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Gest Docs. Todos los derechos reservados.
      </footer>
    </main>
  )
}

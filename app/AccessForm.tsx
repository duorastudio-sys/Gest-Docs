'use client'

import { useState } from 'react'

export default function AccessForm() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado('loading')
    setMensaje('')

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (res.ok) {
      setEstado('ok')
      setEmail('')
    } else {
      setEstado('error')
      setMensaje(data.error ?? 'Ha ocurrido un error. Inténtalo de nuevo.')
    }
  }

  if (estado === 'ok') {
    return (
      <div className="text-center py-2">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-sm font-medium text-gray-900">¡Apuntado!</p>
        <p className="text-sm text-gray-500 mt-1">Te avisaremos en cuanto abramos acceso.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {mensaje && <p className="text-xs text-red-600 text-left">{mensaje}</p>}
      <button
        type="submit"
        disabled={estado === 'loading'}
        className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {estado === 'loading' ? 'Enviando…' : 'Solicitar acceso'}
      </button>
    </form>
  )
}

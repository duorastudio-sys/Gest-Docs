'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  expedienteId: string
  ultimoRecordatorio?: string | null
}

export default function RecordatorioBtn({ expedienteId, ultimoRecordatorio }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  const handleClick = async () => {
    setEstado('sending')
    const res = await fetch(`/api/recordatorio/${expedienteId}`, { method: 'POST' })
    if (res.ok) {
      setEstado('ok')
      router.refresh()
      setTimeout(() => setEstado('idle'), 3000)
    } else {
      setEstado('error')
    }
  }

  const fechaFormateada = ultimoRecordatorio
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ultimoRecordatorio))
    : null

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={estado === 'sending' || estado === 'ok'}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:cursor-default
          border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-60
          data-[ok=true]:border-green-300 data-[ok=true]:text-green-700 data-[ok=true]:bg-green-50
          data-[error=true]:border-red-300 data-[error=true]:text-red-600"
        data-ok={estado === 'ok'}
        data-error={estado === 'error'}
      >
        {estado === 'sending' && 'Enviando…'}
        {estado === 'ok' && '✓ Recordatorio enviado'}
        {estado === 'error' && 'Error al enviar'}
        {estado === 'idle' && 'Enviar recordatorio'}
      </button>
      {fechaFormateada && estado === 'idle' && (
        <span className="text-xs text-gray-400">Último: {fechaFormateada}</span>
      )}
    </div>
  )
}

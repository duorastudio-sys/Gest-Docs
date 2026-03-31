'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

interface FileEntry {
  name: string
  status: 'uploading' | 'success' | 'error'
  errorMsg?: string
}

interface Props {
  clienteId: string
  expedienteId: string
  token: string
}

export default function UploadZone({ clienteId, expedienteId, token }: Props) {
  const router = useRouter()
  const [files, setFiles] = useState<FileEntry[]>([])

  const updateFile = (name: string, update: Partial<FileEntry>) =>
    setFiles(prev => prev.map(f => (f.name === name ? { ...f, ...update } : f)))

  const uploadFile = async (file: File) => {
    setFiles(prev => {
      const exists = prev.some(f => f.name === file.name)
      return exists
        ? prev.map(f => (f.name === file.name ? { name: file.name, status: 'uploading' } : f))
        : [...prev, { name: file.name, status: 'uploading' }]
    })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clienteId', clienteId)
    formData.append('expedienteId', expedienteId)
    formData.append('token', token)

    try {
      const res = await fetch('/api/portal/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir el archivo')
      updateFile(file.name, { status: 'success' })
      router.refresh()
    } catch (err) {
      updateFile(file.name, {
        status: 'error',
        errorMsg: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  const onDrop = useCallback(
    (accepted: File[]) => accepted.forEach(uploadFile),
    [clienteId, expedienteId, token]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 20 * 1024 * 1024,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400 active:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          {isDragActive ? (
            <p className="text-blue-600 font-semibold">Suelta aquí los archivos</p>
          ) : (
            <>
              <p className="text-gray-800 font-semibold">Arrastra tus documentos aquí</p>
              <p className="text-gray-400 text-sm">o toca para seleccionar</p>
              <p className="text-gray-400 text-xs mt-1">PDF, JPG, PNG · Máx. 20 MB por archivo</p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm"
            >
              <StatusIcon status={f.status} />
              <span className="text-sm text-gray-800 truncate flex-1">{f.name}</span>
              <span
                className={`text-xs flex-shrink-0 ${
                  f.status === 'uploading'
                    ? 'text-gray-400'
                    : f.status === 'success'
                    ? 'text-green-600 font-medium'
                    : 'text-red-500'
                }`}
              >
                {f.status === 'uploading' && 'Subiendo…'}
                {f.status === 'success' && 'Enviado'}
                {f.status === 'error' && (f.errorMsg ?? 'Error')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: FileEntry['status'] }) {
  if (status === 'uploading') {
    return (
      <svg
        className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    )
  }
  if (status === 'success') {
    return <span className="text-green-500 flex-shrink-0 text-base">✓</span>
  }
  return <span className="text-red-500 flex-shrink-0 text-base">✗</span>
}

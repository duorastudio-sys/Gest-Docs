type TipoDocumento = 'factura' | 'dni' | 'modelo_fiscal' | 'otro'

const REGLAS: Array<{ palabras: RegExp; tipo: TipoDocumento }> = [
  {
    palabras: /factura|fra[_.\-\s]|invoice/i,
    tipo: 'factura',
  },
  {
    palabras: /\bdni\b|\bnie\b|pasaporte|identidad/i,
    tipo: 'dni',
  },
  {
    palabras: /\b(303|347|190|111|130)\b|modelo/i,
    tipo: 'modelo_fiscal',
  },
]

export function clasificarDocumento(nombreArchivo: string): TipoDocumento {
  // Strip extension and normalize separators for matching
  const nombre = nombreArchivo.replace(/\.[^.]+$/, '').replace(/[_\-]/g, ' ')

  for (const regla of REGLAS) {
    if (regla.palabras.test(nombre)) return regla.tipo
  }

  return 'otro'
}

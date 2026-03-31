import { Resend } from 'resend'

const TIPO_LABELS: Record<string, string> = {
  factura: 'Factura',
  dni: 'DNI / Identificación',
  modelo_fiscal: 'Modelo fiscal',
  otro: 'Otro documento',
}

interface Pendiente {
  tipo_documento: string
  obligatorio: boolean
}

interface EnviarRecordatorioParams {
  clienteEmail: string
  clienteNombre: string
  gestoriaNombre: string
  expedienteNombre: string
  expedientePeriodo: string
  pendientes: Pendiente[]
  portalUrl: string
}

export async function enviarRecordatorio({
  clienteEmail,
  clienteNombre,
  gestoriaNombre,
  expedienteNombre,
  expedientePeriodo,
  pendientes,
  portalUrl,
}: EnviarRecordatorioParams): Promise<{ error: Error | null }> {
  const pendientesRows = pendientes
    .map(r => {
      const label = TIPO_LABELS[r.tipo_documento] ?? r.tipo_documento
      const badge = r.obligatorio
        ? `<span style="font-size:11px;font-weight:600;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:1px 6px;margin-left:8px;">Obligatorio</span>`
        : ''
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.obligatorio ? '#ef4444' : '#f59e0b'};margin-right:10px;vertical-align:middle;"></span>
            ${label}${badge}
          </td>
        </tr>`
    })
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#1e40af;letter-spacing:-0.5px;">
                ${gestoriaNombre}
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:32px 28px;">

              <p style="margin:0 0 8px;font-size:16px;color:#111827;">
                Hola, <strong>${clienteNombre}</strong>:
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Te recordamos que tienes documentación pendiente para el expediente
                <strong style="color:#111827;">${expedienteNombre} (${expedientePeriodo})</strong>.
                Por favor, accede al portal y adjunta los archivos lo antes posible.
              </p>

              <!-- Pending docs table -->
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
                Documentos que necesitamos
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${pendientesRows}
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}"
                       style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                              font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">
                      Acceder al portal →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:12px;color:#9ca3af;">
              Si ya enviaste los documentos, puedes ignorar este mensaje.<br/>
              Este correo fue enviado por ${gestoriaNombre} a través de Gest Docs.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'Gest Docs <noreply@gestdocs.com>',
    to: clienteEmail,
    subject: `Documentación pendiente — ${gestoriaNombre}`,
    html,
  })

  return { error: error as Error | null }
}

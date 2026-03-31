import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: {
    default: 'Gest Docs — Gestión documental para gestorías',
    template: '%s | Gest Docs',
  },
  description:
    'Plataforma para que gestorías recojan documentación de sus clientes de forma rápida y organizada. Portal personalizado por cliente, recordatorios automáticos y clasificación inteligente.',
  openGraph: {
    title: 'Gest Docs — Gestión documental para gestorías',
    description:
      'Portal de documentación para gestorías. Tus clientes suben sus archivos en un clic.',
    type: 'website',
    locale: 'es_ES',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}

import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JARVIS SaaS Compagnon',
  description: 'Interface d\'IA conversationnelle pour salles de sport',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

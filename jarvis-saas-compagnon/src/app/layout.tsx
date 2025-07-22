import type { Metadata } from 'next'
import { ChakraProviders } from '../components/ChakraProviders'
import './globals.css'

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
      <body>
        <ChakraProviders>
          {children}
        </ChakraProviders>
      </body>
    </html>
  )
}

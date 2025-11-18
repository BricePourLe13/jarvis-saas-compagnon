import { Inter } from 'next/font/google'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { SentryProvider } from '@/components/providers/SentryProvider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata = {
  title: 'JARVIS SaaS - Agent Vocal IA pour Salles de Sport',
  description: 'Dashboard professionnel de gestion pour l\'agent vocal JARVIS',
  icons: {
    icon: '/images/logo_jarvis.png',
    apple: '/images/logo_jarvis.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta httpEquiv="Permissions-Policy" content="microphone=(self), camera=(), geolocation=()" />
        <meta httpEquiv="Feature-Policy" content="microphone 'self'; camera 'none'; geolocation 'none'" />
      </head>
      <body className={inter.className}>
        <SentryProvider>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </SentryProvider>
      </body>
    </html>
  )
}

import { Inter } from 'next/font/google'
import { ChakraProviders } from '@/components/ChakraProviders'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'JARVIS SaaS Compagnon',
  description: 'Votre assistant IA pour les salles de sport',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppression des avertissements d'hydratation pour les extensions
              if (typeof window !== 'undefined') {
                const originalConsoleError = console.error;
                console.error = (...args) => {
                  const message = args[0];
                  if (typeof message === 'string' && (
                    message.includes('bis_skin_checked') ||
                    message.includes('__processed_') ||
                    message.includes('bis_register') ||
                    message.includes('A tree hydrated but some attributes')
                  )) {
                    return; // Ignore ces erreurs spécifiques
                  }
                  originalConsoleError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SupabaseProvider>
          <ChakraProviders>
            {children}
          </ChakraProviders>
        </SupabaseProvider>
      </body>
    </html>
  )
}

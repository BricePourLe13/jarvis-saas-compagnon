import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ChakraProviders } from '@/components/ChakraProviders'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { SentryProvider } from '@/components/providers/SentryProvider'
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
        {/* ✅ PHASE 4: Meta tags permissions microphone */}
        <meta httpEquiv="Permissions-Policy" content="microphone=(self), camera=(), geolocation=()" />
        <meta httpEquiv="Feature-Policy" content="microphone 'self'; camera 'none'; geolocation 'none'" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppression des avertissements d'hydratation pour les extensions
              if (typeof window !== 'undefined') {
                const originalConsoleError = console.error;
                console.error = function(...args) {
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ChakraProviders>
            <SentryProvider>
              <SupabaseProvider>
                {children}
              </SupabaseProvider>
            </SentryProvider>
          </ChakraProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
// Force redeploy rollback Thu, Jul 31, 2025 11:53:12 AM

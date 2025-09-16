// Force dynamic rendering pour éviter l'erreur clientReferenceManifest sur Vercel
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function HomePage() {
  // Redirection côté serveur vers le composant client
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.location.href = '/landing-client';
            }
          `
        }}
      />
      Chargement de JARVIS...
    </div>
  )
}

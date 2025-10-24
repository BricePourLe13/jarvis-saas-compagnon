'use client'

/**
 * ERROR BOUNDARY pour /dashboard/overview
 * Capture les erreurs React et affiche un message utilisateur
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('🔥 [ERROR BOUNDARY] Overview error:', error)
  console.error('🔥 [ERROR BOUNDARY] Stack:', error.stack)
  console.error('🔥 [ERROR BOUNDARY] Message:', error.message)
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border-2 border-red-200 rounded-xl p-8 max-w-2xl w-full">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erreur de chargement du dashboard
            </h1>
            <p className="text-gray-600">
              Une erreur technique s'est produite lors du chargement de la page.
            </p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-mono text-red-800">
            {error.message || 'Erreur inconnue'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Retour au dashboard
          </button>
        </div>
        
        {error.stack && (
          <details className="mt-6">
            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
              Détails techniques (pour les développeurs)
            </summary>
            <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto max-h-64">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}


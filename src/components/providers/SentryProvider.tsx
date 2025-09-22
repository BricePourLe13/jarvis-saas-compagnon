"use client"

import { useEffect } from 'react'

/**
 * 📊 Sentry Provider - Monitoring d'erreurs en production
 * Initialise Sentry uniquement en production pour éviter le spam en dev
 */
export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialiser Sentry uniquement en production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Sentry est déjà initialisé via instrumentation.ts
      // On configure juste les options client supplémentaires
      
      if ((window as any).Sentry) {
        const Sentry = (window as any).Sentry
        
        // Configuration des tags globaux
        Sentry.setTag('component', 'client')
        Sentry.setTag('environment', 'production')
        
        // Configuration du contexte utilisateur (si disponible)
        const updateUserContext = () => {
          try {
            const userEmail = localStorage.getItem('user_email')
            if (userEmail) {
              Sentry.setUser({
                email: userEmail,
                id: localStorage.getItem('user_id') || 'anonymous'
              })
            }
          } catch (error) {
            // Ignore les erreurs de localStorage
          }
        }
        
        updateUserContext()
        
        // Capturer les erreurs non gérées
        window.addEventListener('unhandledrejection', (event) => {
          Sentry.captureException(event.reason, {
            tags: {
              type: 'unhandled_promise_rejection'
            }
          })
        })
        
        // Capturer les erreurs de ressources
        window.addEventListener('error', (event) => {
          if (event.filename) {
            Sentry.captureException(new Error(`Resource loading error: ${event.filename}`), {
              tags: {
                type: 'resource_error',
                filename: event.filename
              }
            })
          }
        })
        
        console.log('✅ Sentry monitoring activé en production')
      }
    }
  }, [])

  return <>{children}</>
}



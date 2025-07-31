'use client'

import { useEffect, useState } from 'react'
import { createBrowserClientWithConfig } from '../../lib/supabase-admin'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'franchise_owner' | 'franchise_admin'
}

export default function AuthGuard({ children, requiredRole = 'super_admin' }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClientWithConfig()

  useEffect(() => {
    async function checkAuth() {
      try {
        // Vérifier l'utilisateur authentifié
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.log('Pas d\'utilisateur authentifié, redirection vers login')
          router.push('/')
          return
        }

        setUser(user)

        // Récupérer le profil utilisateur avec rôle
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erreur récupération profil:', profileError)
          router.push('/')
          return
        }

        if (!profile) {
          console.log('Profil utilisateur non trouvé')
          router.push('/')
          return
        }

        // Vérifier le rôle requis
        if (requiredRole && profile.role !== requiredRole && profile.role !== 'super_admin') {
          console.log(`Accès refusé. Rôle requis: ${requiredRole}, rôle actuel: ${profile.role}`)
          router.push('/unauthorized')
          return
        }

        setUserProfile(profile)
      } catch (error) {
        console.error('Erreur authentification:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Vérification des autorisations...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null // La redirection est en cours
  }

  return <>{children}</>
}

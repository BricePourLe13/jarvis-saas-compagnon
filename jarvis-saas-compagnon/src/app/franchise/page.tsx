'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase-simple'
import { Database } from '../../types/database'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

type Franchise = Database['public']['Tables']['franchises']['Row']
type UserProfile = Database['public']['Tables']['users']['Row']

export default function FranchisePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        router.push('/auth/login')
        return
      }

      setUserProfile(profile)

      if (profile.role !== 'franchise_owner' && profile.role !== 'franchise_admin') {
        alert('Accès non autorisé')
        router.push('/dashboard')
        return
      }

      // Charger la franchise
      if (profile.franchise_id) {
        loadFranchise(profile.franchise_id)
      }
    } catch (error) {
      console.error('Erreur authentification:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadFranchise = async (franchiseId: string) => {
    try {
      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchiseId)
        .single()

      if (error) {
        console.error('Erreur chargement franchise:', error)
        return
      }

      setFranchise(data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                🏢 Gestion Franchise
              </h1>
              {franchise && (
                <span className="text-purple-300 text-sm">
                  {franchise.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                🏠 Dashboard
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {franchise ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                📍 {franchise.name}
              </h2>
              <p className="text-gray-300">
                Gérez votre franchise et suivez ses performances
              </p>
            </div>

            {/* Informations de la franchise */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 mb-8">
              <h3 className="text-xl font-semibold text-white mb-6">ℹ️ Informations de la franchise</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Coordonnées</h4>
                  <div className="space-y-2">
                    <p className="text-gray-300"><span className="text-gray-400">Adresse:</span> {franchise.address}</p>
                    <p className="text-gray-300"><span className="text-gray-400">Ville:</span> {franchise.city} {franchise.postal_code}</p>
                    <p className="text-gray-300"><span className="text-gray-400">Email:</span> {franchise.email}</p>
                    <p className="text-gray-300"><span className="text-gray-400">Téléphone:</span> {franchise.phone}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Statut</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        franchise.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {franchise.is_active ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Créé le {new Date(franchise.created_at!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions de gestion */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-semibold text-white mb-6">⚡ Gestion de la franchise</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                  <span>👥</span>
                  <span>Utilisateurs</span>
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                  <span>💬</span>
                  <span>Sessions IA</span>
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                  <span>📊</span>
                  <span>Analytics</span>
                </button>
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                  <span>⚙️</span>
                  <span>Paramètres</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucune franchise assignée</h3>
            <p className="text-gray-400 mb-6">
              Contactez l'administrateur pour être associé à une franchise
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Retour au Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

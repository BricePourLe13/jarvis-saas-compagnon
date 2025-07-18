'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase-simple'
import { Database } from '../../types/database'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

type Franchise = Database['public']['Tables']['franchises']['Row']
type KioskSession = Database['public']['Tables']['kiosk_sessions']['Row']
type UserProfile = Database['public']['Tables']['users']['Row']

interface FranchiseWithStats extends Franchise {
  user_count?: number
  session_count?: number
  avg_satisfaction?: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [franchises, setFranchises] = useState<FranchiseWithStats[]>([])
  const [selectedFranchise, setSelectedFranchise] = useState<FranchiseWithStats | null>(null)
  const [sessions, setSessions] = useState<KioskSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

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

      if (!['super_admin', 'franchise_owner'].includes(profile.role)) {
        alert('Accès non autorisé')
        router.push('/')
        return
      }

      loadFranchises()
    } catch (error) {
      console.error('Erreur authentification:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadFranchises = async () => {
    try {
      const { data, error } = await supabase
        .from('franchises')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement franchises:', error)
        return
      }

      const franchisesWithStats: FranchiseWithStats[] = data || []
      setFranchises(franchisesWithStats)
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
                🚀 JARVIS Admin Dashboard
              </h1>
              {userProfile && (
                <span className="text-purple-300 text-sm">
                  {userProfile.role === 'super_admin' ? '👑 Super Admin' : '🏢 Franchise Owner'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            📊 Tableau de bord - Franchises
          </h2>
          <p className="text-gray-300">
            Gérez vos franchises et consultez leurs performances
          </p>
        </div>

        {/* Grille des franchises */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {franchises.map((franchise) => (
            <div
              key={franchise.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all duration-200 hover:scale-105"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{franchise.name}</h3>
                  <p className="text-gray-300 mb-2">{franchise.address}, {franchise.city} {franchise.postal_code}</p>
                  <p className="text-gray-400 text-sm">{franchise.email} • {franchise.phone}</p>
                </div>
              </div>

              {/* Statut */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${franchise.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {franchise.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="text-purple-400 hover:text-purple-300">
                  👁️ Voir détails
                </div>
              </div>
            </div>
          ))}
        </div>

        {franchises.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucune franchise trouvée</h3>
            <p className="text-gray-400 mb-6">Vérifiez votre base de données Supabase</p>
          </div>
        )}
      </div>
    </div>
  )
}

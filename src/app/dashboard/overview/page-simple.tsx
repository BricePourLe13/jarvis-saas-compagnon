'use client'

import { useEffect, useState } from 'react'
import { Users, Activity, DollarSign, TrendingUp } from 'lucide-react'

/**
 * 🚨 VERSION ULTRA-SIMPLIFIÉE - SANS ERROR BOUNDARY
 * Version minimaliste pour isoler le problème
 */

interface Stats {
  membres_actifs: number
  sessions_mensuelles: number
  revenus_mensuels: number
  taux_retention: number
}

export default function OverviewPageSimple() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/overview/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Erreur de chargement</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vue d'ensemble</h1>

        {/* Grid simplifié */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Carte 1 : Membres actifs */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 mb-4">
              <Users size={20} />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.membres_actifs}
            </div>
            <div className="text-sm text-gray-600">Membres actifs</div>
          </div>

          {/* Carte 2 : Sessions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 mb-4">
              <Activity size={20} />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.sessions_mensuelles}
            </div>
            <div className="text-sm text-gray-600">Sessions ce mois</div>
          </div>

          {/* Carte 3 : Revenus */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 mb-4">
              <DollarSign size={20} />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.revenus_mensuels.toLocaleString('fr-FR')}€
            </div>
            <div className="text-sm text-gray-600">Revenus mensuels</div>
          </div>

          {/* Carte 4 : Rétention */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 mb-4">
              <TrendingUp size={20} />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.taux_retention}%
            </div>
            <div className="text-sm text-gray-600">Taux de rétention</div>
          </div>

        </div>
      </div>
    </div>
  )
}


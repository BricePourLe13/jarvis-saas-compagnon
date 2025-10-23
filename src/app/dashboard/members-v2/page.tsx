'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { MemberCard } from '@/components/dashboard-v2/MemberCard'
import { EmptyState } from '@/components/dashboard-v2/EmptyState'
import { PageLoader, SkeletonCard } from '@/components/dashboard-v2/PageLoader'
import { Users, Search, Filter, UserPlus } from 'lucide-react'
import { useState } from 'react'

/**
 * PAGE MEMBERS - Liste membres
 */

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterChurn, setFilterChurn] = useState<string>('all')
  
  // TODO: Récupérer vraies données via secure-queries
  const loading = false
  
  const members = [
    {
      id: '1',
      firstName: 'Marie',
      lastName: 'Dubois',
      badgeId: 'BADGE001',
      goal: 'Perte de poids',
      joinedDate: new Date('2023-01-15'),
      stats: {
        visitsThisMonth: 18,
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        totalVisits: 245,
      },
      churnRisk: 'low' as const,
      satisfactionScore: 4.5,
    },
    {
      id: '2',
      firstName: 'Thomas',
      lastName: 'Martin',
      badgeId: 'BADGE002',
      goal: 'Prise de muscle',
      joinedDate: new Date('2023-06-20'),
      stats: {
        visitsThisMonth: 24,
        lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        totalVisits: 156,
      },
      churnRisk: 'low' as const,
      satisfactionScore: 5,
    },
    {
      id: '3',
      firstName: 'Sophie',
      lastName: 'Bernard',
      badgeId: 'BADGE003',
      goal: 'Remise en forme',
      joinedDate: new Date('2024-01-10'),
      stats: {
        visitsThisMonth: 5,
        lastVisit: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        totalVisits: 42,
      },
      churnRisk: 'high' as const,
      satisfactionScore: 3.5,
    },
    {
      id: '4',
      firstName: 'Lucas',
      lastName: 'Petit',
      badgeId: 'BADGE004',
      goal: 'Endurance',
      joinedDate: new Date('2022-11-05'),
      stats: {
        visitsThisMonth: 2,
        lastVisit: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        totalVisits: 312,
      },
      churnRisk: 'critical' as const,
      satisfactionScore: 2.5,
    },
  ]
  
  const filteredMembers = members.filter(m => {
    const matchSearch = `${m.firstName} ${m.lastName} ${m.badgeId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    
    const matchFilter = filterChurn === 'all' || m.churnRisk === filterChurn
    
    return matchSearch && matchFilter
  })
  
  if (loading) {
    return (
      <DashboardShell>
        <PageLoader message="Chargement des membres..." />
      </DashboardShell>
    )
  }
  
  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Membres</h1>
            <p className="text-gray-600">{members.length} membres actifs</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <UserPlus size={20} />
            Ajouter membre
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou badge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Filter Churn */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterChurn}
              onChange={(e) => setFilterChurn(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les risques</option>
              <option value="low">Faible</option>
              <option value="medium">Moyen</option>
              <option value="high">Élevé</option>
              <option value="critical">Critique</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun membre trouvé"
          description="Aucun membre ne correspond à vos critères de recherche"
          action={{
            label: 'Réinitialiser les filtres',
            onClick: () => {
              setSearchQuery('')
              setFilterChurn('all')
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              {...member}
              onClick={() => console.log('Voir profil', member.id)}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}


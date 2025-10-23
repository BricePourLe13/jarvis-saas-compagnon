'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { SessionCard } from '@/components/dashboard-v2/SessionCard'
import { EmptyState } from '@/components/dashboard-v2/EmptyState'
import { PageLoader } from '@/components/dashboard-v2/PageLoader'
import { MessageSquare, Search, Filter } from 'lucide-react'
import { useState } from 'react'

/**
 * PAGE SESSIONS - Liste conversations JARVIS
 */

export default function SessionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSentiment, setFilterSentiment] = useState<string>('all')
  
  // TODO: Récupérer vraies données via secure-queries
  const loading = false
  
  const sessions = [
    {
      id: '1',
      member: { firstName: 'Marie', lastName: 'Dubois', badgeId: 'BADGE001' },
      duration: 204, // 3min 24s
      sentiment: 'positive' as const,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // Il y a 5min
      topics: ['Perte de poids', 'Programme nutrition', 'Motivation'],
      messagesCount: 12,
    },
    {
      id: '2',
      member: { firstName: 'Thomas', lastName: 'Martin', badgeId: 'BADGE002' },
      duration: 156, // 2min 36s
      sentiment: 'positive' as const,
      createdAt: new Date(Date.now() - 25 * 60 * 1000), // Il y a 25min
      topics: ['Prise de muscle', 'Programme force'],
      messagesCount: 8,
    },
    {
      id: '3',
      member: { firstName: 'Sophie', lastName: 'Bernard', badgeId: 'BADGE003' },
      duration: 89, // 1min 29s
      sentiment: 'neutral' as const,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
      topics: ['Questions générales'],
      messagesCount: 4,
    },
    {
      id: '4',
      member: { firstName: 'Lucas', lastName: 'Petit', badgeId: 'BADGE004' },
      duration: 312, // 5min 12s
      sentiment: 'negative' as const,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5h
      topics: ['Problème équipement', 'Réclamation', 'Horaires'],
      messagesCount: 18,
    },
  ]
  
  const filteredSessions = sessions.filter(s => {
    const matchSearch = `${s.member.firstName} ${s.member.lastName} ${s.member.badgeId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    
    const matchFilter = filterSentiment === 'all' || s.sentiment === filterSentiment
    
    return matchSearch && matchFilter
  })
  
  if (loading) {
    return (
      <DashboardShell>
        <PageLoader message="Chargement des sessions..." />
      </DashboardShell>
    )
  }
  
  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sessions JARVIS</h1>
            <p className="text-gray-600">{sessions.length} conversations aujourd'hui</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Filter Sentiment */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les sentiments</option>
              <option value="positive">Positif</option>
              <option value="neutral">Neutre</option>
              <option value="negative">Négatif</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucune session trouvée"
          description="Aucune conversation ne correspond à vos critères de recherche"
          action={{
            label: 'Réinitialiser les filtres',
            onClick: () => {
              setSearchQuery('')
              setFilterSentiment('all')
            },
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              {...session}
              onClick={() => console.log('Voir session', session.id)}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}


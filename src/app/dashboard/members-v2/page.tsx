'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { MemberCard } from '@/components/dashboard-v2/MemberCard'
import { EmptyState } from '@/components/dashboard-v2/EmptyState'
import { PageLoader } from '@/components/dashboard-v2/PageLoader'
import { Search, Filter, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * PAGE MEMBERS-V2 - Liste membres avec vraies données
 */

interface Member {
  id: string
  badge_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  membership_type?: string
  is_active: boolean
  last_visit?: string
  total_visits: number
  member_since: string
  membership_expires?: string
  gym_name: string
  churnRisk: 'low' | 'medium' | 'high'
}

interface MembersResponse {
  members: Member[]
  total: number
  limit: number
  offset: number
}

export default function MembersV2Page() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter') || 'all'
  
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'churn-risk'>(initialFilter as any)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true)
        
        // Construire l'URL avec paramètres
        const params = new URLSearchParams({
          filter,
          limit: limit.toString(),
          offset: offset.toString()
        })
        
        if (search.trim()) {
          params.set('search', search.trim())
        }

        const res = await fetch(`/api/dashboard/members-v2?${params}`)
        
        if (!res.ok) {
          throw new Error('Erreur chargement membres')
        }

        const data: MembersResponse = await res.json()
        setMembers(data.members)
        setTotal(data.total)
      } catch (err) {
        console.error('Erreur:', err)
        setError('Impossible de charger les membres')
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [filter, search, offset])

  // Mapping pour MemberCard
  const getMemberStatus = (member: Member): 'active' | 'inactive' | 'churning' => {
    if (!member.is_active) return 'inactive'
    if (member.churnRisk === 'high' || member.churnRisk === 'medium') return 'churning'
    return 'active'
  }

  if (loading) {
    return (
      <DashboardShell>
        <PageLoader message="Chargement des membres..." />
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Membres</h1>
        <p className="text-gray-600">{total} membre{total > 1 ? 's' : ''} au total</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou badge..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(0) // Reset pagination
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setFilter('all'); setOffset(0) }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => { setFilter('active'); setOffset(0) }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Actifs
          </button>
          <button
            onClick={() => { setFilter('inactive'); setOffset(0) }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'inactive'
                ? 'bg-orange-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inactifs
          </button>
          <button
            onClick={() => { setFilter('churn-risk'); setOffset(0) }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'churn-risk'
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Risque churn
          </button>
        </div>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun membre trouvé"
          description={search ? "Essayez de modifier vos critères de recherche" : "Aucun membre ne correspond à ce filtre"}
          action={{
            label: "Réinitialiser filtres",
            onClick: () => {
              setFilter('all')
              setSearch('')
              setOffset(0)
            }
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                name={`${member.first_name} ${member.last_name}`}
                email={member.email || 'N/A'}
                status={getMemberStatus(member)}
                memberSince={member.member_since}
                lastVisit={member.last_visit || null}
                sessionsCount={member.total_visits}
                onClick={() => console.log('TODO: Ouvrir profil', member.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-gray-700">
                {Math.floor(offset / limit) + 1} / {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}

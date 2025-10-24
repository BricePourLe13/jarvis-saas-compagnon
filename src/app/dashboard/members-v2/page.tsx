'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Search, Filter, UserPlus } from 'lucide-react'

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  membership_type: string
  churn_risk: string
  last_visit: string | null
  total_sessions: number
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/dashboard/members-v2')
      .then(res => res.json())
      .then(data => {
        setMembers(data.members || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredMembers = members.filter(member => {
    const matchesSearch = search === '' || 
      member.first_name.toLowerCase().includes(search.toLowerCase()) ||
      member.last_name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = filter === 'all' || member.churn_risk === filter
    
    return matchesSearch && matchesFilter
  })

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Membres</h1>
            <p className="text-muted-foreground mt-2">
              Gestion et suivi de vos membres
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <UserPlus className="h-4 w-4" />
            Nouveau membre
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tous les risques</option>
            <option value="low">Risque faible</option>
            <option value="medium">Risque moyen</option>
            <option value="high">Risque élevé</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Membre</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Abonnement</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Sessions</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Dernière visite</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Risque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">
                          {member.first_name} {member.last_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-foreground">{member.email}</div>
                        {member.phone && (
                          <div className="text-muted-foreground">{member.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {member.membership_type || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground">{member.total_sessions}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {member.last_visit ? new Date(member.last_visit).toLocaleDateString('fr-FR') : 'Jamais'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskBadgeColor(member.churn_risk)}`}>
                        {member.churn_risk === 'high' && 'Élevé'}
                        {member.churn_risk === 'medium' && 'Moyen'}
                        {member.churn_risk === 'low' && 'Faible'}
                        {!member.churn_risk && 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMembers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucun membre trouvé
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{filteredMembers.length} membre(s) affiché(s)</span>
          <span>·</span>
          <span>{members.length} membre(s) au total</span>
        </div>
      </div>
    </DashboardShell>
  )
}

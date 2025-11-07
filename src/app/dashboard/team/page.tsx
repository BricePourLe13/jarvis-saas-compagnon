'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Mail, Shield, MoreVertical } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'pending' | 'inactive'
  joined_at: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Remplacer par vraie API call
    setTimeout(() => {
      setMembers([
        {
          id: '1',
          name: 'Vous',
          email: 'vous@gym.com',
          role: 'gym_manager',
          status: 'active',
          joined_at: '2024-01-15'
        }
      ])
      setLoading(false)
    }, 500)
  }, [])

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      gym_manager: 'Gérant',
      gym_staff: 'Staff',
      franchise_owner: 'Propriétaire Franchise',
      super_admin: 'Super Admin'
    }
    return labels[role] || role
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    const labels: Record<string, string> = {
      active: 'Actif',
      pending: 'En attente',
      inactive: 'Inactif'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Équipe</h1>
          <p className="text-gray-400 mt-2">
            Gérer les membres de votre équipe et leurs accès
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 border border-white/20">
          <UserPlus className="w-5 h-5" />
          <span className="font-medium">Inviter</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Users className="w-6 h-6 text-white/70" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{members.length}</p>
              <p className="text-sm text-gray-400">Membres total</p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter(m => m.status === 'active').length}
              </p>
              <p className="text-sm text-gray-400">Actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Mail className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter(m => m.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-400">En attente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team List */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/5">
            <tr className="text-left">
              <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase">Membre</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase">Rôle</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase">Statut</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase">Rejoint le</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="text-sm text-gray-400">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/70">{getRoleLabel(member.role)}</span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(member.status)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/70">
                    {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucun membre</h3>
          <p className="text-gray-400 mb-6">
            Commencez par inviter des membres de votre équipe
          </p>
          <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-200 border border-white/20">
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Inviter un membre</span>
          </button>
        </div>
      )}
    </div>
  )
}


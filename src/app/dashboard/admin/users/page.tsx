'use client'

import { useEffect, useState } from 'react'
import { useGymContext } from '@/contexts/GymContext'
import { 
  Users, 
  Shield, 
  Building2, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Mail,
  Search
} from 'lucide-react'

interface User {
  id: string
  email: string
  role: 'super_admin' | 'gym_manager' | 'member'
  name: string
  is_mfa_enabled: boolean
  gym_id?: string
  gym_name?: string
  gym_access?: string[] // Multi-gym support
  last_sign_in: string
  created_at: string
}

interface UsersMetrics {
  totalUsers: number
  superAdmins: number
  gymManagers: number
  membersCount: number
  mfaEnabled: number
}

export default function UsersAdminPage() {
  const { userRole } = useGymContext()
  const [users, setUsers] = useState<User[]>([])
  const [metrics, setMetrics] = useState<UsersMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'gym_manager' | 'member'>('all')

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/admin/users')
        const data = await response.json()
        
        setUsers(data.users || [])
        setMetrics(data.metrics || null)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Vérifier les permissions
  if (userRole !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">
            Cette page est réservée aux super administrateurs.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      gym_manager: 'bg-green-500/10 text-green-500 border-green-500/20',
      member: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      gym_staff: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }[role] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

    const labels = {
      super_admin: 'Super Admin',
      gym_manager: 'Gérant Salle',
      member: 'Membre'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des accès et permissions
          </p>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Utilisateurs</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalUsers}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Super Admins</span>
            </div>
            <p className="text-3xl font-bold text-purple-500">{metrics.superAdmins}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Gérants Salles</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.gymManagers}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">MFA Activée</span>
            </div>
            <p className="text-3xl font-bold text-green-500">
              {((metrics.mfaEnabled / metrics.totalUsers) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par email ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              roleFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setRoleFilter('super_admin')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              roleFilter === 'super_admin'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => setRoleFilter('gym_manager')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              roleFilter === 'gym_manager'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Gérants
          </button>
          <button
            onClick={() => setRoleFilter('member')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              roleFilter === 'member'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Membres
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Utilisateur</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Rôle</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Organisation</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">MFA</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-foreground">{user.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">
                        {user.gym_access && user.gym_access.length > 0 
                          ? `${user.gym_access.length} salle(s)`
                          : user.gym_name || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_mfa_enabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(user.last_sign_in).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}





/**
 * Dashboard: Custom Tools Management
 * Liste des tools créés par le gérant + Stats + Création
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGymContext } from '@/contexts/GymContext'
import type { CustomTool, GymToolsStats } from '@/types/custom-tools'
import { 
  Activity, 
  Check, 
  Clock, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Copy,
  Play,
  BarChart3
} from 'lucide-react'

export default function CustomToolsPage() {
  const router = useRouter()
  const { currentGym } = useGymContext()
  const [tools, setTools] = useState<CustomTool[]>([])
  const [stats, setStats] = useState<GymToolsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    if (currentGym?.id) {
      loadTools()
      loadStats()
    }
  }, [currentGym?.id])

  async function loadTools() {
    try {
      const response = await fetch(`/api/dashboard/tools?gym_id=${currentGym?.id}`)
      const data = await response.json()
      
      if (data.success) {
        setTools(data.tools)
      }
    } catch (error) {
      console.error('Error loading tools:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    // TODO: Implémenter API route pour stats
    // Pour l'instant, calculer côté client
    if (!tools.length) return

    const activeTools = tools.filter(t => t.status === 'active').length
    const draftTools = tools.filter(t => t.status === 'draft').length
    const pausedTools = tools.filter(t => t.status === 'paused').length
    
    const avgSuccessRate = tools.length > 0
      ? tools.reduce((sum, t) => sum + t.success_rate, 0) / tools.length
      : 0
    
    const mostUsedTool = tools.length > 0
      ? tools.reduce((prev, current) => 
          current.usage_count > prev.usage_count ? current : prev
        )
      : null

    setStats({
      total_tools: tools.length,
      active_tools: activeTools,
      draft_tools: draftTools,
      paused_tools: pausedTools,
      total_executions_today: 0, // TODO: depuis API
      total_executions_week: 0, // TODO: depuis API
      avg_success_rate: avgSuccessRate,
      most_used_tool: mostUsedTool ? {
        id: mostUsedTool.id,
        name: mostUsedTool.display_name,
        usage_count: mostUsedTool.usage_count
      } : null
    })
  }

  async function handleToggleStatus(toolId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    try {
      const response = await fetch(`/api/dashboard/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_data: { status: newStatus } })
      })
      
      if (response.ok) {
        loadTools()
      }
    } catch (error) {
      console.error('Error toggling tool status:', error)
    }
  }

  async function handleDelete(toolId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tool ?')) return
    
    try {
      const response = await fetch(`/api/dashboard/tools/${toolId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadTools()
      }
    } catch (error) {
      console.error('Error deleting tool:', error)
    }
  }

  const filteredTools = selectedStatus === 'all'
    ? tools
    : tools.filter(t => t.status === selectedStatus)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tools JARVIS</h1>
          <p className="text-gray-400 mt-2">
            Créez des actions personnalisées pour votre assistant vocal
          </p>
        </div>
        <Link href="/dashboard/tools/new">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/10">
            <Plus className="h-5 w-5" />
            Créer un tool
          </button>
        </Link>
      </div>

      {/* Stats rapides */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Tools actifs"
            value={stats.active_tools}
            icon={Check}
            color="green"
          />
          <StatCard
            label="Utilisations (7j)"
            value={stats.total_executions_week}
            icon={Activity}
            color="blue"
          />
          <StatCard
            label="Taux succès moyen"
            value={`${stats.avg_success_rate.toFixed(1)}%`}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            label="Tools en draft"
            value={stats.draft_tools}
            icon={Clock}
            color="gray"
          />
        </div>
      )}

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedStatus === 'all'
              ? 'bg-white/20 text-white border border-white/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Tous ({tools.length})
        </button>
        <button
          onClick={() => setSelectedStatus('active')}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedStatus === 'active'
              ? 'bg-white/20 text-white border border-white/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Actifs ({tools.filter(t => t.status === 'active').length})
        </button>
        <button
          onClick={() => setSelectedStatus('draft')}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedStatus === 'draft'
              ? 'bg-white/20 text-white border border-white/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Drafts ({tools.filter(t => t.status === 'draft').length})
        </button>
        <button
          onClick={() => setSelectedStatus('paused')}
          className={`px-4 py-2 rounded-lg transition-all ${
            selectedStatus === 'paused'
              ? 'bg-white/20 text-white border border-white/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          En pause ({tools.filter(t => t.status === 'paused').length})
        </button>
      </div>

      {/* Liste des tools */}
      {filteredTools.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Aucun tool pour le moment
          </h3>
          <p className="text-gray-400 mb-6">
            Créez votre premier tool personnalisé pour JARVIS
          </p>
          <Link href="/dashboard/tools/new">
            <button className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all border border-white/10">
              Créer mon premier tool
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              onEdit={() => router.push(`/dashboard/tools/${tool.id}`)}
            />
          ))}
        </div>
      )}

      {/* Templates section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Templates disponibles
        </h2>
        <p className="text-gray-400 mb-6">
          Démarrez rapidement avec nos templates pré-configurés
        </p>
        <div className="grid grid-cols-3 gap-4">
          <TemplateCard
            name="Réserver un cours"
            description="Permet aux adhérents de réserver une place dans un cours collectif"
            icon="📅"
            category="booking"
            onClick={() => router.push('/dashboard/tools/new?template=reserve_class')}
          />
          <TemplateCard
            name="Consulter horaires"
            description="Affiche les horaires d'ouverture de la salle"
            icon="🕐"
            category="info"
            onClick={() => router.push('/dashboard/tools/new?template=get_gym_hours')}
          />
          <TemplateCard
            name="Commander shake"
            description="Commander un shake protéiné au bar"
            icon="🥤"
            category="action"
            onClick={() => router.push('/dashboard/tools/new?template=order_shake')}
          />
        </div>
        <div className="mt-4 text-center">
          <Link 
            href="/dashboard/tools/templates" 
            className="text-white/70 hover:text-white transition-colors"
          >
            Voir tous les templates →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTS
// ============================================

function StatCard({ 
  label, 
  value, 
  icon: Icon,
  color = 'white'
}: { 
  label: string
  value: string | number
  icon: any
  color?: string
}) {
  const colorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    gray: 'text-gray-400',
    white: 'text-white'
  }

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-6 transition-all duration-200 hover:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`h-6 w-6 ${colorClasses[color as keyof typeof colorClasses]}`} />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

function ToolCard({
  tool,
  onToggleStatus,
  onDelete,
  onEdit
}: {
  tool: CustomTool
  onToggleStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  onEdit: () => void
}) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    paused: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    deprecated: 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const statusLabels = {
    active: 'Actif',
    draft: 'Draft',
    paused: 'En pause',
    deprecated: 'Obsolète'
  }

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-6 transition-all duration-200 hover:border-white/10">
      <div className="flex items-start justify-between">
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{tool.icon || '🔧'}</span>
            <div>
              <h3 className="text-xl font-semibold text-white">{tool.display_name}</h3>
              <p className="text-sm text-gray-500">{tool.name}</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4">{tool.description}</p>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">{tool.usage_count} utilisations</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">{tool.success_rate.toFixed(1)}% succès</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">{tool.avg_execution_time_ms}ms</span>
            </div>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex flex-col items-end gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[tool.status]}`}>
            {statusLabels[tool.status]}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStatus(tool.id, tool.status)}
              className="p-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-all"
              title={tool.status === 'active' ? 'Désactiver' : 'Activer'}
            >
              {tool.status === 'active' ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={onEdit}
              className="p-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-all"
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(tool.id)}
              className="p-2 bg-white/5 text-red-400/70 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({
  name,
  description,
  icon,
  category,
  onClick
}: {
  name: string
  description: string
  icon: string
  category: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-lg p-6 text-left transition-all duration-200 hover:border-white/20 hover:bg-black/60"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
      <p className="text-sm text-gray-400 mb-3">{description}</p>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{category}</span>
    </button>
  )
}


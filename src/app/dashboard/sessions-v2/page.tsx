'use client'

import { DashboardShell } from '@/components/dashboard-v2/DashboardShell'
import { SessionCard } from '@/components/dashboard-v2/SessionCard'
import { EmptyState } from '@/components/dashboard-v2/EmptyState'
import { PageLoader } from '@/components/dashboard-v2/PageLoader'
import { MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * PAGE SESSIONS-V2 - Liste sessions JARVIS avec vraies données
 */

interface Session {
  id: string
  date: string
  duration: number
  member: {
    name: string
    badge: string
  } | null
  sentiment: 'positive' | 'neutral' | 'negative'
  topics: string[]
  summary: string | null
  cost: number
}

interface SessionsResponse {
  sessions: Session[]
  total: number
  limit: number
  offset: number
}

export default function SessionsV2Page() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('week')
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true)
        
        const params = new URLSearchParams({
          filter,
          limit: limit.toString(),
          offset: offset.toString()
        })

        const res = await fetch(`/api/dashboard/sessions-v2?${params}`)
        
        if (!res.ok) {
          throw new Error('Erreur chargement sessions')
        }

        const data: SessionsResponse = await res.json()
        setSessions(data.sessions)
        setTotal(data.total)
      } catch (err) {
        console.error('Erreur:', err)
        setError('Impossible de charger les sessions')
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [filter, offset])

  if (loading) {
    return (
      <DashboardShell>
        <PageLoader message="Chargement des sessions..." />
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sessions JARVIS</h1>
        <p className="text-gray-600">{total} conversation{total > 1 ? 's' : ''} au total</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setFilter('all'); setOffset(0) }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => { setFilter('today'); setOffset(0) }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => { setFilter('week'); setOffset(0) }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          7 derniers jours
        </button>
        <button
          onClick={() => { setFilter('month'); setOffset(0) }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Ce mois
        </button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucune session"
          description="Aucune conversation JARVIS pour cette période"
          action={{
            label: "Voir toutes les sessions",
            onClick: () => {
              setFilter('all')
              setOffset(0)
            }
          }}
        />
      ) : (
        <>
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                memberName={session.member?.name || 'Membre inconnu'}
                date={new Date(session.date)}
                duration={session.duration}
                sentiment={session.sentiment}
                topics={session.topics}
                summary={session.summary}
                onClick={() => console.log('TODO: Ouvrir détails', session.id)}
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

          {/* Stats Footer */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-600 mb-1">Total sessions</p>
                <p className="text-2xl font-bold text-blue-900">{total}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 mb-1">Durée totale</p>
                <p className="text-2xl font-bold text-blue-900">
                  {Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)} min
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 mb-1">Coût total</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${sessions.reduce((acc, s) => acc + s.cost, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}

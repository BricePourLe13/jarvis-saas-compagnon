'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Clock, Smile, Meh, Frown } from 'lucide-react'

interface Session {
  id: string
  member_name: string
  started_at: string
  duration_seconds: number
  sentiment: string
  summary: string
  topics: string[]
}

export default function SessionsPage() {
  const [sessions, setSession] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/dashboard/sessions-v2')
      .then(res => res.json())
      .then(data => {
        setSessions(data.sessions || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    return session.sentiment === filter
  })

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-5 w-5 text-green-500" />
      case 'neutral': return <Meh className="h-5 w-5 text-yellow-500" />
      case 'negative': return <Frown className="h-5 w-5 text-red-500" />
      default: return <Meh className="h-5 w-5 text-gray-500" />
    }
  }

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Positif'
      case 'neutral': return 'Neutre'
      case 'negative': return 'Négatif'
      default: return 'N/A'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sessions JARVIS</h1>
          <p className="text-muted-foreground mt-2">
            Historique des conversations avec vos membres
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'positive'
                ? 'bg-green-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Positives
          </button>
          <button
            onClick={() => setFilter('neutral')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'neutral'
                ? 'bg-yellow-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Neutres
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'negative'
                ? 'bg-red-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Négatives
          </button>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{session.member_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.started_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDuration(session.duration_seconds)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(session.sentiment)}
                      <span className="text-sm font-medium text-foreground">
                        {getSentimentLabel(session.sentiment)}
                      </span>
                    </div>
                  </div>
                </div>

                {session.summary && (
                  <p className="text-muted-foreground mb-4">{session.summary}</p>
                )}

                {session.topics && session.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {session.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredSessions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
                Aucune session trouvée
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{filteredSessions.length} session(s) affichée(s)</span>
          <span>·</span>
          <span>{sessions.length} session(s) au total</span>
        </div>
    </div>
  )
}

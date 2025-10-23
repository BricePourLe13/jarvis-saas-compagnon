'use client'

import { MessageSquare, Clock, User, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * SESSION CARD - Carte session JARVIS
 */

export interface SessionCardProps {
  id: string
  member: {
    firstName: string
    lastName: string
    badgeId: string
  }
  duration: number // en secondes
  sentiment: 'positive' | 'neutral' | 'negative'
  createdAt: Date
  topics?: string[]
  messagesCount: number
  onClick?: () => void
}

const sentimentConfig = {
  positive: { emoji: '😊', label: 'Positif', color: 'text-green-600', bg: 'bg-green-50' },
  neutral: { emoji: '😐', label: 'Neutre', color: 'text-gray-600', bg: 'bg-gray-50' },
  negative: { emoji: '😟', label: 'Négatif', color: 'text-red-600', bg: 'bg-red-50' },
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}min ${secs}s`
}

export function SessionCard({
  id,
  member,
  duration,
  sentiment,
  createdAt,
  topics,
  messagesCount,
  onClick,
}: SessionCardProps) {
  const sentimentData = sentimentConfig[sentiment]
  
  return (
    <div
      data-testid="session-card"
      data-session-id={id}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        {/* Member Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-sm text-gray-500">{member.badgeId}</p>
          </div>
        </div>
        
        {/* Sentiment Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${sentimentData.bg}`}>
          <span className="text-lg">{sentimentData.emoji}</span>
          <span className={`text-sm font-medium ${sentimentData.color}`}>
            {sentimentData.label}
          </span>
        </div>
      </div>
      
      {/* Topics */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {topics.slice(0, 3).map((topic, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
            >
              {topic}
            </span>
          ))}
          {topics.length > 3 && (
            <span className="text-xs text-gray-500">+{topics.length - 3}</span>
          )}
        </div>
      )}
      
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock size={16} />
          <span>{formatDuration(duration)}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <MessageSquare size={16} />
          <span>{messagesCount} messages</span>
        </div>
        
        <div className="flex items-center gap-1.5 ml-auto text-gray-500">
          <span className="text-xs">
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: fr })}
          </span>
        </div>
      </div>
    </div>
  )
}


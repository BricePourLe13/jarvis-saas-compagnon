'use client'

import { User, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

/**
 * MEMBER CARD - Carte membre
 * Usage : Liste membres, profils rapides
 */

export interface MemberCardProps {
  id: string
  firstName: string
  lastName: string
  badgeId: string
  photoUrl?: string
  goal?: string
  joinedDate: Date
  stats: {
    visitsThisMonth: number
    lastVisit?: Date
    totalVisits: number
  }
  churnRisk: 'low' | 'medium' | 'high' | 'critical'
  satisfactionScore?: number
  onClick?: () => void
}

const churnConfig = {
  low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Faible' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Moyen' },
  high: { bg: 'bg-red-100', text: 'text-red-800', label: 'Élevé' },
  critical: { bg: 'bg-red-600', text: 'text-white', label: 'Critique', pulse: true },
}

export function MemberCard({
  id,
  firstName,
  lastName,
  badgeId,
  photoUrl,
  goal,
  joinedDate,
  stats,
  churnRisk,
  satisfactionScore,
  onClick,
}: MemberCardProps) {
  const churn = churnConfig[churnRisk]
  const initials = `${firstName[0]}${lastName[0]}`
  
  return (
    <div
      data-testid="member-card"
      data-member-id={id}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${firstName} ${lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {initials}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">
                {firstName} {lastName}
              </h3>
              <p className="text-sm text-gray-500">Badge: {badgeId}</p>
            </div>
            
            {/* Churn Risk Badge */}
            <span className={`
              text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap
              ${churn.bg} ${churn.text}
              ${churn.pulse ? 'animate-pulse-subtle' : ''}
            `}>
              {churnRisk === 'critical' && <AlertTriangle size={12} className="inline mr-1" />}
              {churn.label}
            </span>
          </div>
          
          {goal && (
            <p className="text-sm text-gray-600 mb-3">Objectif: {goal}</p>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Visites ce mois:</span>
              <span className="font-semibold text-gray-900">{stats.visitsThisMonth}</span>
            </div>
            
            {stats.lastVisit && (
              <div className="flex items-center gap-1 text-gray-500">
                <span>Dernière:</span>
                <span>{Math.floor((Date.now() - stats.lastVisit.getTime()) / (1000 * 60 * 60 * 24))}j</span>
              </div>
            )}
            
            {satisfactionScore && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Satisfaction:</span>
                <span className="font-semibold text-green-600">{satisfactionScore}/5</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { LucideIcon } from 'lucide-react'
import { ArrowUp, ArrowDown } from 'lucide-react'

/**
 * METRIC CARD - Carte métrique (inspiré Vercel)
 * 
 * Affiche une métrique avec tendance, icône, et état
 * Usage : Dashboard overview, KPIs
 */

export interface MetricCardProps {
  /** Titre de la métrique */
  label: string
  
  /** Valeur principale (peut être string ou number) */
  value: string | number
  
  /** Icône Lucide */
  icon: LucideIcon
  
  /** Couleur de l'icône/badge */
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  
  /** Tendance (optionnel) */
  trend?: {
    /** Valeur de la tendance (ex: "+12%") */
    value: string
    /** Direction */
    direction: 'up' | 'down'
    /** Positive = vert, negative = rouge */
    isPositive?: boolean
  }
  
  /** Badge status (optionnel) */
  badge?: {
    label: string
    variant: 'success' | 'warning' | 'error'
  }
  
  /** Click handler */
  onClick?: () => void
  
  /** État loading */
  loading?: boolean
}

const iconColorClasses = {
  primary: 'bg-blue-50 text-blue-600',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-orange-50 text-orange-600',
  error: 'bg-red-50 text-red-600',
  info: 'bg-cyan-50 text-cyan-600',
}

const badgeClasses = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-orange-100 text-orange-800',
  error: 'bg-red-100 text-red-800',
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor = 'primary',
  trend,
  badge,
  onClick,
  loading = false,
}: MetricCardProps) {
  const isClickable = !!onClick
  
  // GUARD : Vérifier que Icon est défini
  if (!Icon) {
    console.error('❌ [MetricCard] Icon undefined pour:', label)
    return (
      <div className="bg-white border border-red-200 rounded-xl p-5">
        <div className="text-red-600 text-sm mb-2">Erreur d'icône</div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
          <div className="h-5 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    )
  }
  
  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-xl p-5
        transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md' : ''}
      `}
      onClick={onClick}
    >
      {/* Header : Icon + Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconColorClasses[iconColor]}`}>
          <Icon size={20} />
        </div>
        
        {badge && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeClasses[badge.variant]}`}>
            {badge.label}
          </span>
        )}
      </div>
      
      {/* Value */}
      <div className="text-4xl font-bold text-gray-900 mb-2">
        {value}
      </div>
      
      {/* Label */}
      <div className="text-sm text-gray-600 mb-2">
        {label}
      </div>
      
      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1">
          {trend.direction === 'up' ? (
            <ArrowUp size={14} className={trend.isPositive ? 'text-green-600' : 'text-red-600'} />
          ) : (
            <ArrowDown size={14} className={trend.isPositive ? 'text-green-600' : 'text-red-600'} />
          )}
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
        </div>
      )}
    </div>
  )
}


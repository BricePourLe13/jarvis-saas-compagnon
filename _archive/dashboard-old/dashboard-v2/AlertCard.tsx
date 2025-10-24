'use client'

import { LucideIcon, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * ALERT CARD - Carte alerte (inspiré Sentry)
 * 
 * Affiche une alerte avec priorité, actions, et timestamp
 * Usage : Notifications, alertes système, churn risk
 */

export interface AlertCardProps {
  /** Priorité de l'alerte */
  priority: 'urgent' | 'warning' | 'info'
  
  /** Titre de l'alerte */
  title: string
  
  /** Description (optionnel) */
  description?: string
  
  /** Timestamp */
  timestamp: Date
  
  /** Actions (boutons) */
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  
  /** Icône custom (optionnel, sinon auto selon priority) */
  icon?: LucideIcon
  
  /** Handler pour fermer */
  onDismiss?: () => void
}

const priorityConfig = {
  urgent: {
    borderColor: 'border-l-red-500',
    bgGradient: 'bg-gradient-to-r from-red-50/50 to-transparent',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
  },
  warning: {
    borderColor: 'border-l-orange-500',
    bgGradient: 'bg-gradient-to-r from-orange-50/50 to-transparent',
    icon: AlertCircle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
  },
  info: {
    borderColor: 'border-l-blue-500',
    bgGradient: 'bg-gradient-to-r from-blue-50/50 to-transparent',
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
}

export function AlertCard({
  priority,
  title,
  description,
  timestamp,
  actions,
  icon,
  onDismiss,
}: AlertCardProps) {
  const config = priorityConfig[priority]
  const Icon = icon || config.icon
  
  return (
    <div
      className={`
        relative bg-white border border-gray-200 rounded-xl overflow-hidden
        border-l-4 ${config.borderColor}
        animate-slide-in-top
      `}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 ${config.bgGradient} pointer-events-none`} />
      
      {/* Content */}
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center`}>
            <Icon size={20} className={config.iconColor} />
          </div>
          
          {/* Title + Description */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(timestamp, { addSuffix: true, locale: fr })}
            </p>
          </div>
          
          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${action.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


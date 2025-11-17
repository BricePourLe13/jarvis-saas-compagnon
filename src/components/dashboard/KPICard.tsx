import { ReactNode } from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: LucideIcon
  description?: string
}

export default function KPICard({
  label,
  value,
  trend,
  icon: Icon,
  description
}: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <p className="metric-label">{label}</p>
        {Icon && (
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <p className="metric-value">{value}</p>

      {trend && (
        <div className={`flex items-center gap-1 text-sm ${
          trend.isPositive ? 'trend-up' : 'trend-down'
        }`}>
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium">
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-muted-foreground text-xs">vs. mois dernier</span>
        </div>
      )}

      {description && !trend && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  )
}


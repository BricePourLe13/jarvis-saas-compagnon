import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode // Support children as alias for actions
}

export default function PageHeader({
  title,
  description,
  actions,
  children
}: PageHeaderProps) {
  const headerActions = children || actions
  
  return (
    <div className="dashboard-header px-6 py-6">
      <div className="max-w-7xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center gap-3">
            {headerActions}
          </div>
        )}
      </div>
    </div>
  )
}



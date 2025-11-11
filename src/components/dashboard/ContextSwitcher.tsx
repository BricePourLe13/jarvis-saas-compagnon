'use client'

import { useGymContext } from '@/contexts/GymContext'
import { Building2, ChevronDown, Check } from 'lucide-react'

export function ContextSwitcher() {
  const {
    userRole,
    selectedGymId,
    availableGyms,
    setSelectedGymId,
    loading
  } = useGymContext()

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg animate-pulse">
        <div className="h-4 w-4 bg-muted rounded"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    )
  }

  // Gym manager: Single gym, no switcher needed
  if (userRole === 'gym_manager' && availableGyms.length === 1) {
    const currentGym = availableGyms[0]
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {currentGym?.name || 'Ma salle'}
        </span>
      </div>
    )
  }

  // Super admin or multi-gym manager: Dropdown selector
  const currentGym = availableGyms.find(g => g.id === selectedGymId)
  
  // Group gyms by legacy_franchise_name (for display only)
  const groupedGyms = userRole === 'super_admin' && availableGyms.length > 0
    ? availableGyms.reduce((acc, gym) => {
        const franchiseName = gym.legacy_franchise_name || 'Salles indépendantes'
        if (!acc[franchiseName]) {
          acc[franchiseName] = []
        }
        acc[franchiseName].push(gym)
        return acc
      }, {} as Record<string, typeof availableGyms>)
    : null

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:bg-card-hover transition-colors">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {currentGym?.name || 'Sélectionner une salle'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      <div className="absolute top-full mt-2 left-0 min-w-[280px] bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-2 max-h-[400px] overflow-y-auto">
          {userRole === 'super_admin' && groupedGyms ? (
            <>
              {/* Option "Toutes les salles" */}
              <button
                onClick={() => setSelectedGymId(null)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-between ${
                  selectedGymId === null ? 'bg-primary/10 text-primary' : 'text-foreground'
                }`}
              >
                <span className="text-sm font-medium">📊 Toutes les salles</span>
                {selectedGymId === null && <Check className="h-4 w-4" />}
              </button>
              
              <div className="h-px bg-border my-2"></div>

              {/* Grouped by legacy franchise name */}
              {Object.entries(groupedGyms).map(([franchiseName, gyms]) => (
                <div key={franchiseName} className="mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    {franchiseName}
                  </div>
                  {gyms.map(gym => (
                    <button
                      key={gym.id}
                      onClick={() => setSelectedGymId(gym.id)}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-between ${
                        selectedGymId === gym.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium">{gym.name}</div>
                        <div className="text-xs text-muted-foreground">{gym.city}</div>
                      </div>
                      {selectedGymId === gym.id && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              ))}
            </>
          ) : (
            /* Gym manager with multiple gyms: Just their gyms */
            availableGyms.map(gym => (
              <button
                key={gym.id}
                onClick={() => setSelectedGymId(gym.id)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-between ${
                  selectedGymId === gym.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{gym.name}</div>
                  <div className="text-xs text-muted-foreground">{gym.city}</div>
                </div>
                {selectedGymId === gym.id && <Check className="h-4 w-4" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


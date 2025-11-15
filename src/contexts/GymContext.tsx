'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'
import type { UserRole, Gym } from '@/types/core'

// ============================================
// GYM CONTEXT TYPE
// ============================================

export interface GymContextType {
  // User info
  userId: string | null
  userRole: UserRole | null
  userEmail: string | null
  
  // Context selection
  selectedGymId: string | null
  currentGym: Gym | null
  
  // Data
  availableGyms: Gym[]
  
  // Actions
  setSelectedGymId: (gymId: string | null) => void
  refreshGyms: () => Promise<void>
  
  // Loading
  loading: boolean
}

const GymContext = createContext<GymContextType | undefined>(undefined)

// ============================================
// GYM CONTEXT PROVIDER
// ============================================

export function GymContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = getSupabaseSingleton()
  
  // State
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null)
  const [currentGym, setCurrentGym] = useState<Gym | null>(null)
  const [availableGyms, setAvailableGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)

  // ============================================
  // LOAD GYMS BASED ON ROLE
  // ============================================
  
  const loadGyms = async (role: UserRole, gymId?: string | null) => {
    try {
      if (role === 'super_admin') {
        // Super admin: load ALL gyms
        const { data: gyms, error } = await supabase
          .from('gyms')
          .select('id, name, city, address, postal_code, phone, status, manager_id, created_at, updated_at, legacy_franchise_name')
          .order('name')

        if (error) {
          console.error('[GymContext] Error loading gyms:', error)
          return
        }

        if (gyms) {
          setAvailableGyms(gyms as Gym[])
          
          // Restore last selected gym from localStorage
          const savedGymId = localStorage.getItem('jarvis_selected_gym_id')
          if (savedGymId && gyms.some(g => g.id === savedGymId)) {
            setSelectedGymId(savedGymId)
            setCurrentGym(gyms.find(g => g.id === savedGymId) as Gym || null)
          } else if (gyms.length > 0) {
            // Default to first gym
            setSelectedGymId(gyms[0].id)
            setCurrentGym(gyms[0] as Gym)
          }
        }

      } else if (role === 'gym_manager') {
        // Gym manager: only their gym(s) from gym_access
        const { data: userProfile } = await supabase
          .from('users')
          .select('gym_id, gym_access')
          .eq('id', userId)
          .single()

        if (!userProfile) return

        // Get gym IDs (gym_access is array of gym IDs)
        const gymIds = userProfile.gym_access || (userProfile.gym_id ? [userProfile.gym_id] : [])

        if (gymIds.length === 0) {
          console.warn('[GymContext] Gym manager has no gym access')
          return
        }

        const { data: gyms, error } = await supabase
          .from('gyms')
          .select('id, name, city, address, postal_code, phone, status, manager_id, created_at, updated_at, legacy_franchise_name')
          .in('id', gymIds)
          .order('name')

        if (error) {
          console.error('[GymContext] Error loading gyms:', error)
          return
        }

        if (gyms) {
          setAvailableGyms(gyms as Gym[])
          
          // Restore last selected gym from localStorage (if accessible)
          const savedGymId = localStorage.getItem('jarvis_selected_gym_id')
          if (savedGymId && gyms.some(g => g.id === savedGymId)) {
            setSelectedGymId(savedGymId)
            setCurrentGym(gyms.find(g => g.id === savedGymId) as Gym || null)
          } else if (gymId && gyms.some(g => g.id === gymId)) {
            // Use gym_id from profile
            setSelectedGymId(gymId)
            setCurrentGym(gyms.find(g => g.id === gymId) as Gym || null)
          } else if (gyms.length > 0) {
            // Default to first gym
            setSelectedGymId(gyms[0].id)
            setCurrentGym(gyms[0] as Gym)
          }
        }
      }

    } catch (error) {
      console.error('[GymContext] Error in loadGyms:', error)
    }
  }

  // ============================================
  // REFRESH GYMS (for external updates)
  // ============================================
  
  const refreshGyms = async () => {
    if (userRole) {
      await loadGyms(userRole, selectedGymId)
    }
  }

  // ============================================
  // INITIALIZE CONTEXT ON MOUNT
  // ============================================
  
  useEffect(() => {
    async function initializeContext() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        setUserId(session.user.id)
        setUserEmail(session.user.email || null)

        // Get user profile from public.users
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role, gym_id, gym_access')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('[GymContext] Error fetching user profile:', profileError)
          setLoading(false)
          return
        }

        const role = userProfile.role as UserRole
        setUserRole(role)

        // Load gyms based on role
        await loadGyms(role, userProfile.gym_id)

      } catch (error) {
        console.error('[GymContext] Initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeContext()
  }, []) // Empty deps: only run once on mount

  // ============================================
  // SAVE SELECTED GYM TO LOCALSTORAGE
  // ============================================
  
  useEffect(() => {
    if (selectedGymId) {
      localStorage.setItem('jarvis_selected_gym_id', selectedGymId)
      
      // Update currentGym when selectedGymId changes
      const gym = availableGyms.find(g => g.id === selectedGymId)
      if (gym) {
        setCurrentGym(gym)
      }
    }
  }, [selectedGymId, availableGyms])

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: GymContextType = {
    userId,
    userRole,
    userEmail,
    selectedGymId,
    currentGym,
    availableGyms,
    setSelectedGymId,
    refreshGyms,
    loading,
  }

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

// ============================================
// HOOK TO USE THE CONTEXT
// ============================================

export function useGymContext() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error('useGymContext must be used within a GymContextProvider')
  }
  return context
}

  // ============================================
  
  useEffect(() => {
    if (selectedGymId) {
      localStorage.setItem('jarvis_selected_gym_id', selectedGymId)
      
      // Update currentGym when selectedGymId changes
      const gym = availableGyms.find(g => g.id === selectedGymId)
      if (gym) {
        setCurrentGym(gym)
      }
    }
  }, [selectedGymId, availableGyms])

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: GymContextType = {
    userId,
    userRole,
    userEmail,
    selectedGymId,
    currentGym,
    availableGyms,
    setSelectedGymId,
    refreshGyms,
    loading,
  }

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

// ============================================
// HOOK TO USE THE CONTEXT
// ============================================

export function useGymContext() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error('useGymContext must be used within a GymContextProvider')
  }
  return context
}

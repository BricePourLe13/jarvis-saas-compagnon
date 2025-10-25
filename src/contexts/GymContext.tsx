'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

// Types
export type UserRole = 'super_admin' | 'franchise_owner' | 'gym_manager' | 'gym_staff' | 'member'

export interface Franchise {
  id: string
  name: string
  city: string
}

export interface Gym {
  id: string
  franchise_id: string
  name: string
  city: string
  status: string
}

export interface GymContextType {
  // User info
  userId: string | null
  userRole: UserRole | null
  userEmail: string | null
  
  // Context selection
  selectedGymId: string | null
  selectedFranchiseId: string | null
  contextMode: 'all' | 'franchise' | 'single'
  
  // Data
  availableGyms: Gym[]
  availableFranchises: Franchise[]
  
  // Actions
  setSelectedGymId: (gymId: string | null) => void
  setSelectedFranchiseId: (franchiseId: string | null) => void
  
  // Loading
  loading: boolean
}

const GymContext = createContext<GymContextType | undefined>(undefined)

export function GymContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = getSupabaseSingleton()
  
  // State
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null)
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null)
  const [contextMode, setContextMode] = useState<'all' | 'franchise' | 'single'>('single')
  const [availableGyms, setAvailableGyms] = useState<Gym[]>([])
  const [availableFranchises, setAvailableFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize context on mount
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
          .select('role, gym_id, franchise_id, gym_access, franchise_access')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('[GymContext] Error fetching user profile:', profileError)
          setLoading(false)
          return
        }

        const role = userProfile.role as UserRole
        setUserRole(role)

        // Load context based on role
        if (role === 'super_admin') {
          // Super admin: load all franchises and gyms
          setContextMode('all')
          
          const [franchisesRes, gymsRes] = await Promise.all([
            supabase.from('franchises').select('id, name, city').order('name'),
            supabase.from('gyms').select('id, franchise_id, name, city, status').order('name')
          ])

          if (franchisesRes.data) setAvailableFranchises(franchisesRes.data)
          if (gymsRes.data) setAvailableGyms(gymsRes.data)

          // Restore last selected context from localStorage
          const savedGymId = localStorage.getItem('jarvis_selected_gym_id')
          if (savedGymId && gymsRes.data?.some(g => g.id === savedGymId)) {
            setSelectedGymId(savedGymId)
          } else if (gymsRes.data && gymsRes.data.length > 0) {
            setSelectedGymId(gymsRes.data[0].id)
          }

        } else if (role === 'franchise_owner') {
          // Franchise owner: load their franchise and gyms
          setContextMode('franchise')
          setSelectedFranchiseId(userProfile.franchise_id)

          const { data: gyms } = await supabase
            .from('gyms')
            .select('id, franchise_id, name, city, status')
            .eq('franchise_id', userProfile.franchise_id)
            .order('name')

          if (gyms) {
            setAvailableGyms(gyms)
            // Default to first gym
            const savedGymId = localStorage.getItem('jarvis_selected_gym_id')
            if (savedGymId && gyms.some(g => g.id === savedGymId)) {
              setSelectedGymId(savedGymId)
            } else if (gyms.length > 0) {
              setSelectedGymId(gyms[0].id)
            }
          }

        } else if (role === 'gym_manager' || role === 'gym_staff') {
          // Gym manager/staff: only their gym
          setContextMode('single')
          setSelectedGymId(userProfile.gym_id)

          const { data: gym } = await supabase
            .from('gyms')
            .select('id, franchise_id, name, city, status')
            .eq('id', userProfile.gym_id)
            .single()

          if (gym) {
            setAvailableGyms([gym])
          }
        }

      } catch (error) {
        console.error('[GymContext] Initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeContext()
  }, [supabase, router])

  // Save selected gym to localStorage when it changes
  useEffect(() => {
    if (selectedGymId && contextMode !== 'single') {
      localStorage.setItem('jarvis_selected_gym_id', selectedGymId)
    }
  }, [selectedGymId, contextMode])

  const value: GymContextType = {
    userId,
    userRole,
    userEmail,
    selectedGymId,
    selectedFranchiseId,
    contextMode,
    availableGyms,
    availableFranchises,
    setSelectedGymId,
    setSelectedFranchiseId,
    loading,
  }

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

// Hook to use the context
export function useGymContext() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error('useGymContext must be used within a GymContextProvider')
  }
  return context
}


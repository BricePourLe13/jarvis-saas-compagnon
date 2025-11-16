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
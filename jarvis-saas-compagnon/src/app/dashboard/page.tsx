'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'
import ManagerLayout from '@/components/manager/ManagerLayout'
import DashboardContent from '@/components/manager/DashboardContent'
import OnboardingBanner from '@/components/manager/OnboardingBanner'

type Overview = {
  gym_id: string
  gym_name: string
  satisfaction_score: number
  alerts_count: number
  sessions_today: number
  active_sessions: number
  kiosk_status: 'online' | 'offline' | 'error'
}

type OnboardingProgress = {
  appairage_done: boolean
  mission_done: boolean
  fiche_done: boolean
  suggestion_done: boolean
  classement_done: boolean
  completed_at: string | null
}

export default function ManagerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()
  const [gymIdFromUrl, setGymIdFromUrl] = useState<string | null>(null)
  const supabase = getSupabaseSingleton()

  useEffect(() => {
    // Éviter useSearchParams pour le build statique: lire depuis window
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const gid = url.searchParams.get('gymId')
      setGymIdFromUrl(gid)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Récupérer le profil pour vérifier le rôle
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const role = (profile as any)?.role
      const isAdmin = role === 'super_admin' || role === 'franchise_owner' || role === 'franchise_admin'
      const isManager = role === 'manager' || isAdmin
      if (!isManager) {
        router.push('/unauthorized')
        return
      }

      // gymId optionnel dans l'URL (ex: accès depuis admin)
      const gymId = gymIdFromUrl || ''
      const qs = gymId ? `?gymId=${encodeURIComponent(gymId)}` : ''
      
      // Charger les données overview
      const res = await fetch(`/api/manager/overview${qs}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setOverview(json.data)
      }
      
      // Charger l'état d'onboarding
      const onboardingRes = await fetch(`/api/manager/onboarding${qs}`, { cache: 'no-store' })
      if (onboardingRes.ok) {
        const onboardingJson = await onboardingRes.json()
        setOnboarding(onboardingJson)
        
        // Afficher l'onboarding si pas terminé
        const isCompleted = onboardingJson.completed_at != null
        setShowOnboarding(!isCompleted)
      }
      
      setLoading(false)
    }
    init()
  }, [router, gymIdFromUrl, supabase])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  return (
    <ManagerLayout 
      currentPage="Vue d'ensemble"
      gymName={overview?.gym_name || 'AREA'}
      onlineStatus={overview?.kiosk_status === 'online'}
    >
      {/* Contenu principal du dashboard */}
      <Box>
        {/* Bannière onboarding discrète si non terminé */}
        {showOnboarding && overview && (
          <Box p={6} pb={0}>
            <OnboardingBanner 
              gymId={overview.gym_id} 
              onComplete={handleOnboardingComplete}
              onDismiss={() => setShowOnboarding(false)}
            />
          </Box>
        )}

        <DashboardContent 
          overview={overview}
          loading={loading}
        />
      </Box>
    </ManagerLayout>
  )
}



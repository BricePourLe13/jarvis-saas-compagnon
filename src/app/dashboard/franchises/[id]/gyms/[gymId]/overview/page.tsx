/**
 * 📊 GYM OVERVIEW - CENTRE DE COMMANDEMENT
 * Vue d'ensemble avec nouvelle architecture Sentry
 */

'use client'

import { useState, useEffect } from 'react'
import { Box } from '@chakra-ui/react'
import SentryMainLayout from '@/components/dashboard/layouts/SentryMainLayout'
import OverviewModule from '@/components/dashboard/gym-modules/OverviewModule'

interface OverviewPageProps {
  params: Promise<{ id: string; gymId: string }>
}

export default function OverviewPage({ params }: OverviewPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; gymId: string } | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params
        setResolvedParams(resolved)
      } catch (error) {
        console.error('Error resolving params:', error)
      }
    }
    resolveParams()
  }, [params])

  if (!resolvedParams) {
    return <Box>Loading...</Box>
  }

  return (
    <SentryMainLayout
      currentPath={['dashboard', 'franchises', resolvedParams.id, 'gyms', resolvedParams.gymId, 'overview']}
      gymId={resolvedParams.gymId}
      franchiseId={resolvedParams.id}
    >
      <Box p={6}>
        <OverviewModule gymId={resolvedParams.gymId} />
      </Box>
    </SentryMainLayout>
  )
}

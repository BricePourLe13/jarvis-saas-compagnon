/**
 * 🔧 GYM OPERATIONS - MONITORING TEMPS RÉEL
 * Operations avec nouvelle architecture Sentry
 */

'use client'

import { useState, useEffect } from 'react'
import { Box } from '@chakra-ui/react'
import SentryMainLayout from '@/components/dashboard/layouts/SentryMainLayout'
import OperationsModule from '@/components/dashboard/gym-modules/OperationsModule'

interface OperationsPageProps {
  params: Promise<{ id: string; gymId: string }>
}

export default function OperationsPage({ params }: OperationsPageProps) {
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
      currentPath={['dashboard', 'franchises', resolvedParams.id, 'gyms', resolvedParams.gymId, 'operations']}
      gymId={resolvedParams.gymId}
      franchiseId={resolvedParams.id}
    >
      <Box p={6}>
        <OperationsModule gymId={resolvedParams.gymId} />
      </Box>
    </SentryMainLayout>
  )
}


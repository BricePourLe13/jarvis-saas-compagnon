/**
 * 👤 PROFIL MEMBRE
 * REDIRECTION VERS NOUVELLE VERSION SENTRY
 */

'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

export default function MemberRedirect({ params }: { params: { memberId: string } }) {
  const router = useRouter()
  const { memberId } = params

  useEffect(() => {
    // Redirection vers la nouvelle version Sentry
    router.replace(`/dashboard/members/${memberId}/sentry`)
  }, [router, memberId])

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Redirection vers le profil membre...</Text>
      </VStack>
    </Box>
  )
}
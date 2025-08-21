'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Container, VStack, Heading, Text, Button, Input, FormControl, FormLabel, FormErrorMessage, HStack } from '@chakra-ui/react'
import { createBrowserClientWithConfig } from '@/lib/supabase-admin'

export default function MFAChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createBrowserClientWithConfig()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      // Récupérer le premier facteur TOTP
      // @ts-ignore
      const list = await (supabase.auth as any).mfa?.listFactors?.()
      const totp = list?.data?.totp?.[0]
      if (!totp) { setError('Aucun facteur TOTP. Active d’abord la 2FA.'); return }
      setFactorId(totp.id || totp.factorId)
    }
    init()
  }, [router])

  const handleSubmit = async () => {
    setError(null)
    const supabase = createBrowserClientWithConfig()
    if (!factorId) { setError('Facteur introuvable'); return }
    // @ts-ignore
    const challenge = await (supabase.auth as any).mfa?.challenge({ factorId })
    const challengeId = challenge?.data?.id
    if (!challengeId || challenge?.error) { setError('Challenge impossible'); return }
    // @ts-ignore
    const verify = await (supabase.auth as any).mfa?.verify({ factorId, challengeId, code: code.trim() })
    if (verify?.error) { setError('Code invalide'); return }
    // Retour au dashboard/admin
    // Décider de la destination en fonction du rôle
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('role').eq('id', user?.id).single()
    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_owner' || profile?.role === 'franchise_admin'
    router.push(isAdmin ? '/admin' : '/dashboard')
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="md">
        <VStack spacing={6} align="stretch">
          <Heading size="lg" color="gray.800" textAlign="center">Vérification 2FA</Heading>
          <Text color="gray.600" textAlign="center">Entre le code à 6 chiffres de ton application d’authentification.</Text>
          <FormControl isInvalid={!!error}>
            <FormLabel>Code 2FA</FormLabel>
            <HStack>
              <Input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="123456" maxW="200px" />
              <Button colorScheme="blue" onClick={handleSubmit}>Valider</Button>
            </HStack>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>
        </VStack>
      </Container>
    </Box>
  )
}



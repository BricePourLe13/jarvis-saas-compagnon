'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Container, VStack, Heading, Text, Button, Input, FormControl, FormLabel, FormErrorMessage, HStack, Spinner } from '@chakra-ui/react'
import { createBrowserClientWithConfig } from '@/lib/supabase-admin'

export default function MFAEnrollPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [secretUri, setSecretUri] = useState<string | null>(null)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    const init = async () => {
      if (initializedRef.current) return
      initializedRef.current = true
      const supabase = createBrowserClientWithConfig()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/setup')
        return
      }

      // Vérifier profil: si déjà enrolled, retourner admin
      const { data: profile } = await supabase
        .from('users')
        .select('mfa_required, mfa_enrolled')
        .eq('id', user.id)
        .single()

      if (!profile?.mfa_required) {
        router.push('/dashboard')
        return
      }
      if (profile?.mfa_enrolled) {
        router.push('/dashboard')
        return
      }

      // Générer un facteur TOTP si non existant, sinon réutiliser l'existant non vérifié
      try {
        // @ts-ignore - compat
        const listRes = await (supabase.auth as any).mfa?.listFactors?.()
        let uriToUse: string | null = null
        let idToUse: string | null = null
        const existingTotp = listRes?.data?.totp?.find?.((f:any)=>!f.verified)
        if (existingTotp) {
          uriToUse = existingTotp?.totp?.uri || existingTotp?.totpUri || null
          idToUse = existingTotp?.id || existingTotp?.factorId || null
        } else {
          // @ts-ignore - types mfa
          const { data: factor, error: createErr } = await (supabase.auth as any).mfa?.enroll({ factorType: 'totp' })
          if (createErr) throw createErr
          uriToUse = factor?.totp?.uri || factor?.totpUri || null
          idToUse = factor?.id || factor?.factorId || null
        }

        if (uriToUse) setSecretUri(uriToUse)
        if (idToUse) setFactorId(idToUse)
        if (uriToUse) {
          const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uriToUse)}`
          setQrUrl(url)
        }
      } catch (e) {
        // Fallback: 422 souvent dû à un facteur déjà créé → relister et réutiliser
        try {
          // @ts-ignore
          const listRes2 = await (supabase.auth as any).mfa?.listFactors?.()
          const existingTotp2 = listRes2?.data?.totp?.find?.((f:any)=>!f.verified)
          const uri2 = existingTotp2?.totp?.uri || existingTotp2?.totpUri || null
          const id2 = existingTotp2?.id || existingTotp2?.factorId || null
          if (uri2) setSecretUri(uri2)
          if (id2) setFactorId(id2)
          if (uri2) setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri2)}`)
        } catch {}
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const handleVerify = async () => {
    setError(null)
    const supabase = createBrowserClientWithConfig()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/setup')
      return
    }
    if (!factorId) {
      setError('Facteur TOTP non initialisé. Recharge la page et réessaie.')
      return
    }
    try {
      // Étape obligatoire: créer un challenge puis vérifier avec challengeId
      // @ts-ignore
      const challengeRes = await (supabase.auth as any).mfa?.challenge({ factorId })
      const challengeId = challengeRes?.data?.id
      if (!challengeId || challengeRes?.error) {
        setError('Impossible de lancer le challenge MFA')
        return
      }
      // @ts-ignore - compat mfa API
      const { error: verifyErr } = await (supabase.auth as any).mfa?.verify({ factorId, challengeId, code: code.trim() })
      if (verifyErr) {
        setError('Code invalide, réessayez')
        return
      }

      // Marquer le profil comme enrôlé
      await supabase
        .from('users')
        .update({ mfa_enrolled: true, mfa_verified_at: new Date().toISOString() })
        .eq('id', user.id)

      router.push('/dashboard')
    } catch (e:any) {
      setError('Vérification impossible pour le moment')
    }
  }

  const handleReset = async () => {
    setError(null)
    const supabase = createBrowserClientWithConfig()
    try {
      // @ts-ignore
      const listRes = await (supabase.auth as any).mfa?.listFactors?.()
      const allTotp = listRes?.data?.totp || []
      for (const f of allTotp) {
        // @ts-ignore
        await (supabase.auth as any).mfa?.unenroll?.({ factorId: f.id || f.factorId })
      }
      // Ré‑enrôler proprement
      // @ts-ignore
      const { data: factor } = await (supabase.auth as any).mfa?.enroll({ factorType: 'totp' })
      const uri = factor?.totp?.uri || factor?.totpUri || null
      const id = factor?.id || factor?.factorId || null
      setSecretUri(uri)
      setFactorId(id)
      setQrUrl(uri ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}` : null)
    } catch (e:any) {
      setError("Impossible de réinitialiser la 2FA pour le moment")
    }
  }

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Préparation de l’activation 2FA…</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="md">
        <VStack spacing={6} align="stretch">
          <Heading size="lg" color="gray.800" textAlign="center">Activer la double authentification</Heading>
          <Text color="gray.600" textAlign="center">
            Scanne le QR code avec Google Authenticator (ou équivalent), puis entre le code à 6 chiffres.
          </Text>

          {qrUrl ? (
            <VStack spacing={3} align="center">
              <Box as="img" src={qrUrl} alt="QR TOTP" borderRadius="md" border="1px solid" borderColor="gray.200" />
              <Text fontSize="sm" color="gray.500">Scanne le QR puis entre le code à 6 chiffres.</Text>
            </VStack>
          ) : secretUri ? (
            <VStack spacing={3} bg="white" border="1px solid" borderColor="gray.100" p={4} borderRadius="md">
              <Text fontSize="sm" color="gray.500">URI TOTP (si le QR n’apparaît pas):</Text>
              <Box w="full" bg="gray.50" p={2} borderRadius="md" fontSize="xs" color="gray.700" wordBreak="break-all">{secretUri}</Box>
            </VStack>
          ) : (
            <Box bg="yellow.50" border="1px solid" borderColor="yellow.200" p={3} borderRadius="md">
              <Text fontSize="sm" color="yellow.800">
                QR non disponible pour le moment. Recharge la page; si le problème persiste, je peux ajouter un bouton pour régénérer ou réinitialiser la 2FA.
              </Text>
            </Box>
          )}

          <FormControl isInvalid={!!error}>
            <FormLabel>Code 2FA</FormLabel>
            <HStack>
              <Input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="123456" maxW="200px" />
              <Button colorScheme="blue" onClick={handleVerify}>Valider</Button>
              <Button variant="outline" onClick={handleReset}>Réinitialiser 2FA</Button>
            </HStack>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>

          <Text fontSize="sm" color="gray.500" textAlign="center">Tu pourras changer de téléphone plus tard en révoquant la 2FA.</Text>
        </VStack>
      </Container>
    </Box>
  )
}



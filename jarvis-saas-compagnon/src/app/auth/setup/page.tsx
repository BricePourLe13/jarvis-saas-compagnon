'use client'

import { 
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  useToast,
  Spinner,
  Icon,
  HStack,
  Card,
  CardBody
} from '@chakra-ui/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase-simple'

// ===========================================
// 🔐 TYPES & INTERFACES
// ===========================================

interface SetupForm {
  password: string
  confirmPassword: string
}

// ===========================================
// 🎯 COMPOSANT PRINCIPAL
// ===========================================

function SetupContent() {
  const [formData, setFormData] = useState<SetupForm>({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const type = searchParams.get('type')

  useEffect(() => {
    verifyInvitation()
  }, [])

  const verifyInvitation = async () => {
    try {
      setVerifying(true)
      const supabase = createClient()
      
      // Vérifier si l'utilisateur est connecté (invitation acceptée)
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        setTokenValid(false)
        return
      }

      // Récupérer les infos utilisateur
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile) {
        setTokenValid(false)
        return
      }

      setUserInfo({
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role
      })
      setTokenValid(true)

    } catch (error) {
      console.error('Erreur vérification invitation:', error)
      setTokenValid(false)
    } finally {
      setVerifying(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.password.trim()) {
      newErrors.password = 'Mot de passe requis'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Minimum 8 caractères'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmation requise'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (updateError) {
        toast({
          title: 'Erreur',
          description: updateError.message,
          status: 'error',
          duration: 5000,
        })
        return
      }

      // Activer le compte
      const { error: activateError } = await supabase
        .from('users')
        .update({ 
          is_active: true,
          last_login: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)

      if (activateError) {
        console.error('Erreur activation:', activateError)
      }

      toast({
        title: 'Compte configuré !',
        description: 'Redirection vers le dashboard...',
        status: 'success',
        duration: 3000,
      })

      // Redirection selon le rôle
      setTimeout(() => {
        if (userInfo?.role === 'super_admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }, 1000)

    } catch (error) {
      toast({
        title: 'Erreur système',
        description: 'Une erreur inattendue s\'est produite',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur'
      case 'franchise_owner': return 'Propriétaire de Franchise'
      default: return role
    }
  }

  if (verifying) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Vérification de l'invitation...</Text>
        </VStack>
      </Box>
    )
  }

  if (!tokenValid) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card>
            <CardBody textAlign="center">
              <VStack spacing={4}>
                <Icon as={AlertCircle} boxSize={12} color="red.500" />
                <Heading size="lg" color="gray.800">Invitation invalide</Heading>
                <Text color="gray.600">
                  Cette invitation n'est plus valide ou a déjà été utilisée.
                </Text>
                <Button colorScheme="blue" onClick={() => router.push('/')}>
                  Retour à l'accueil
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="md">
        <VStack spacing={8}>
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Icon as={UserPlus} boxSize={12} color="blue.500" />
            <Heading size="lg" color="gray.800">Finaliser votre compte</Heading>
            <Text color="gray.600">
              Définissez votre mot de passe pour accéder à JARVIS
            </Text>
          </VStack>

          {/* Infos utilisateur */}
          <Card w="full">
            <CardBody>
              <VStack spacing={3} align="start">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Informations du compte
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.500">Email:</Text>
                  <Text fontSize="sm" fontWeight="medium">{userInfo?.email}</Text>
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.500">Nom:</Text>
                  <Text fontSize="sm" fontWeight="medium">{userInfo?.full_name}</Text>
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.500">Rôle:</Text>
                  <Text fontSize="sm" fontWeight="medium" color="blue.600">
                    {getRoleLabel(userInfo?.role)}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Formulaire mot de passe */}
          <Card w="full">
            <CardBody>
              <VStack spacing={6}>
                <FormControl isInvalid={!!errors.password} isRequired>
                  <FormLabel>Mot de passe</FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 caractères"
                  />
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.confirmPassword} isRequired>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Répétez votre mot de passe"
                  />
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>

                <Button
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  onClick={handleSubmit}
                  isLoading={loading}
                  loadingText="Configuration..."
                  leftIcon={<Icon as={CheckCircle} />}
                >
                  Configurer mon compte
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="lg" color="blue.500" />
      </Box>
    }>
      <SetupContent />
    </Suspense>
  )
} 
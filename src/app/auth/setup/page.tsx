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
import { createBrowserClientWithConfig } from '@/lib/supabase-admin'

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
  const role = searchParams.get('role')

  useEffect(() => {
    verifyInvitation()
  }, [])

  const verifyInvitation = async () => {
    try {
      setVerifying(true)
      const supabase = createBrowserClientWithConfig()
      
      // 🔄 NOUVELLE LOGIQUE: Gérer les invitations Supabase
      
      // IMPORTANT: Pour les invitations, on doit TOUJOURS traiter les paramètres URL
      // même si un utilisateur est déjà connecté (cas invitation différente)
      
      // 1. Vérifier d'abord les paramètres URL pour invitation
      // Supabase met les tokens dans le fragment (#) et non les query params (?)
      const urlParams = new URLSearchParams(window.location.search)
      const fragmentParams = new URLSearchParams(window.location.hash.substring(1))
      const hasInvitationParams = urlParams.has('token_hash') || urlParams.has('token') || 
                                  fragmentParams.has('access_token') || fragmentParams.has('type')
      
      // Si pas de paramètres d'invitation, vérifier si utilisateur déjà connecté
      if (!hasInvitationParams) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (user && !userError) {
          // Utilisateur déjà connecté, vérifier son profil
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!profileError && userProfile) {
            setUserInfo({
              email: userProfile.email,
              full_name: userProfile.full_name,
              role: userProfile.role
            })
            setTokenValid(true)
            return
          }
        }
      }

      // 2. Traiter les paramètres d'invitation s'ils existent
      
      if (hasInvitationParams) {
        // Il y a des paramètres d'invitation dans l'URL
        // Log supprimé pour production
        
        // Cas spécial : si on a un access_token dans le fragment, établir la session
        if (fragmentParams.has('access_token')) {
          // Log supprimé pour production
          
          // Forcer l'établissement de session avec les tokens du fragment
          const accessToken = fragmentParams.get('access_token')
          const refreshToken = fragmentParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            // Log supprimé pour production
            
            // Établir la session avec les tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (sessionError) {
              // Log supprimé pour production
            } else if (sessionData.user) {
              // Log supprimé pour production
            
            // Récupérer le profil
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', sessionData.user.id)
              .single()

            if (!profileError && userProfile) {
              // Log supprimé pour production
              setUserInfo({
                email: userProfile.email,
                full_name: userProfile.full_name,
                role: userProfile.role
              })
              setTokenValid(true)
              return
            }
            }
          } else {
            // Log supprimé pour production
          }
        }
        
        // Sinon, traitement classique des tokens dans query params
        // Attendre un peu que Supabase traite l'invitation
        // Log supprimé pour production
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Re-vérifier si l'utilisateur est maintenant connecté
        // Log supprimé pour production
        const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser()
        
        // Log supprimé pour production
        
        if (retryUser && !retryError) {
          // Log supprimé pour production
          // L'invitation a été traitée, récupérer le profil
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', retryUser.id)
            .single()

          // Log supprimé pour production

          if (!profileError && userProfile) {
            // Log supprimé pour production
            setUserInfo({
              email: userProfile.email,
              full_name: userProfile.full_name,
              role: userProfile.role
            })
            setTokenValid(true)
            return
          }
        }
        
        // Essayer une deuxième fois avec un délai plus long
        // Log supprimé pour production
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const { data: { user: retry2User }, error: retry2Error } = await supabase.auth.getUser()
        // Log supprimé pour production
        
        if (retry2User && !retry2Error) {
          // Log supprimé pour production
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', retry2User.id)
            .single()

          // Log supprimé pour production

          if (!profileError && userProfile) {
            // Log supprimé pour production
            setUserInfo({
              email: userProfile.email,
              full_name: userProfile.full_name,
              role: userProfile.role
            })
            setTokenValid(true)
            return
          }
        }
      }

      // 3. Si toujours pas de succès, marquer comme invalide
      // Log supprimé pour production
      setTokenValid(false)

    } catch (error) {
      // Log supprimé pour production
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
      const supabase = createBrowserClientWithConfig()

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

      // Activer le compte ET mettre à jour last_login
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utilisateur non trouvé après mise à jour mot de passe')
      }

      const { error: activateError } = await supabase
        .from('users')
        .update({ 
          is_active: true,
          last_login: new Date().toISOString()
        })
        .eq('id', user.id)

      if (activateError) {
        // Log supprimé pour production
        throw new Error('Impossible d\'activer le compte: ' + activateError.message)
      }

      // Log supprimé pour production

      // Message personnalisé selon le rôle
      const getWelcomeMessage = (role: string) => {
        switch (role) {
          case 'super_admin': return 'Accès administrateur accordé !'
          case 'franchise_owner': return 'Bienvenue propriétaire de franchise !'
          case 'gym_manager': return 'Accès manager de salle accordé !'
          case 'gym_staff': return 'Bienvenue dans l\'équipe !'
          default: return 'Compte configuré avec succès !'
        }
      }
      
      toast({
        title: getWelcomeMessage(userInfo?.role || ''),
        description: 'Redirection en cours...',
        status: 'success',
        duration: 3000,
      })

      // Redirection selon le rôle
      setTimeout(() => {
        if (userInfo?.role === 'super_admin' || userInfo?.role === 'franchise_owner') {
          router.push('/admin')
        } else if (userInfo?.role === 'gym_manager' || userInfo?.role === 'gym_staff') {
          router.push('/franchise')
        } else {
          router.push('/admin') // Fallback vers admin
        }
      }, 2000)

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
    // Debug: afficher les paramètres URL et fragments
    const urlParams = new URLSearchParams(window.location.search)
    const fragmentParams = new URLSearchParams(window.location.hash.substring(1))
    const debugInfo = {
      // Query params
      type: urlParams.get('type'),
      token_hash: urlParams.get('token_hash'),
      token: urlParams.get('token'),
      redirect_to: urlParams.get('redirect_to'),
      // Fragment params (où Supabase met les tokens)
      access_token: fragmentParams.get('access_token'),
      refresh_token: fragmentParams.get('refresh_token'),
      expires_at: fragmentParams.get('expires_at'),
      token_type: fragmentParams.get('token_type'),
      type_fragment: fragmentParams.get('type')
    }

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
                
                {/* Debug info en développement */}
                {process.env.NODE_ENV === 'development' && (
                  <Box mt={4} p={3} bg="gray.100" borderRadius="md" fontSize="sm">
                    <Text fontWeight="bold" mb={2}>Debug Info:</Text>
                    <Text>URL: {window.location.href}</Text>
                    <Text>Query Type: {debugInfo.type || 'N/A'}</Text>
                    <Text>Query Token Hash: {debugInfo.token_hash ? 'Présent' : 'Absent'}</Text>
                    <Text>Query Token: {debugInfo.token ? 'Présent' : 'Absent'}</Text>
                    <Text fontWeight="bold" color="blue.600" mt={2}>Fragment Params:</Text>
                    <Text>Access Token: {debugInfo.access_token ? 'Présent' : 'Absent'}</Text>
                    <Text>Type Fragment: {debugInfo.type_fragment || 'N/A'}</Text>
                    <Text>Expires At: {debugInfo.expires_at || 'N/A'}</Text>
                  </Box>
                )}
                
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
              {role && `En tant que ${getRoleLabel(role)}, définissez`} votre mot de passe pour accéder à JARVIS
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
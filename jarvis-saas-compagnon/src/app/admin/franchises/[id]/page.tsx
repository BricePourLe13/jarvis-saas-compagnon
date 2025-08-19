/**
 * 🏢 FRANCHISE DETAIL - Page propre
 * Vue complète d'une franchise avec ses salles
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  Box, 
  Grid, 
  Card, 
  CardBody, 
  Heading, 
  Text, 
  Badge, 
  Button, 
  Flex, 
  VStack, 
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { FiArrowLeft, FiMapPin, FiUsers, FiActivity, FiSettings, FiPlus } from 'react-icons/fi'

interface FranchiseDetails {
  id: string
  name: string
  slug: string
  city?: string
  owner: {
    name: string | null
    email: string
  }
  gyms: Array<{
    id: string
    name: string
    slug: string
    city: string
    is_active: boolean
    _count: { memberships: number }
  }>
  _count: { gyms: number }
}

export default function FranchiseDetailPage() {
  const [franchise, setFranchise] = useState<FranchiseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    loadFranchise()
  }, [params.id])

  const loadFranchise = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/franchises/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Franchise non trouvée')
      }
      
      const data = await response.json()
      setFranchise(data.franchise)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box p={8} bg="black" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.400">Chargement de la franchise...</Text>
        </VStack>
      </Box>
    )
  }

  if (error || !franchise) {
    return (
      <Box p={8} bg="black" minH="100vh">
        <Alert status="error" bg="red.900" color="white">
          <AlertIcon />
          {error || 'Franchise non trouvée'}
        </Alert>
        <Button 
          mt={4} 
          leftIcon={<Icon as={FiArrowLeft} />}
          onClick={() => router.push('/admin')}
        >
          Retour
        </Button>
      </Box>
    )
  }

  const totalMembers = franchise.gyms.reduce((sum, gym) => sum + gym._count.memberships, 0)
  const activeGyms = franchise.gyms.filter(gym => gym.is_active).length

  return (
    <Box p={8} bg="black" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={1}>
          <Button 
            variant="ghost" 
            leftIcon={<Icon as={FiArrowLeft} />}
            onClick={() => router.push('/admin')}
            color="gray.400"
            size="sm"
          >
            Retour aux franchises
          </Button>
          
          <Heading color="white" size="xl">{franchise.name}</Heading>
          <Text color="gray.400">{franchise.city || 'Localisation non définie'}</Text>
          <Text color="gray.500" fontSize="sm">
            Propriétaire: {franchise.owner.name || franchise.owner.email}
          </Text>
        </VStack>
        
        <Button 
          colorScheme="blue"
          leftIcon={<Icon as={FiPlus} />}
          onClick={() => router.push(`/admin/franchises/${franchise.id}/gyms/create`)}
        >
          Nouvelle Salle
        </Button>
      </Flex>

      {/* Stats Franchise */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6} mb={8}>
        <Card bg="gray.900" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">
                <HStack>
                  <Icon as={FiMapPin} />
                  <Text>Salles Total</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white" fontSize="2xl">{franchise._count.gyms}</StatNumber>
              <StatHelpText color="green.400">{activeGyms} actives</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.900" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">
                <HStack>
                  <Icon as={FiUsers} />
                  <Text>Membres Total</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white" fontSize="2xl">{totalMembers.toLocaleString()}</StatNumber>
              <StatHelpText color="blue.400">Réseau franchise</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.900" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">
                <HStack>
                  <Icon as={FiActivity} />
                  <Text>Taux Activité</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white" fontSize="2xl">
                {franchise._count.gyms > 0 ? Math.round((activeGyms / franchise._count.gyms) * 100) : 0}%
              </StatNumber>
              <StatHelpText color="purple.400">Salles actives</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Liste des salles */}
      <Heading color="white" size="lg" mb={6}>🏋️ Salles de la franchise</Heading>
      
      {franchise.gyms.length === 0 ? (
        <Card bg="gray.900" borderColor="gray.700">
          <CardBody textAlign="center" py={12}>
            <Text color="gray.400" fontSize="lg" mb={4}>Aucune salle configurée</Text>
            <Button 
              colorScheme="blue"
              onClick={() => router.push(`/admin/franchises/${franchise.id}/gyms/create`)}
            >
              Créer la première salle
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
          {franchise.gyms.map((gym) => (
            <Card 
              key={gym.id}
              bg="gray.900" 
              borderColor="gray.700"
              _hover={{ borderColor: "blue.500", transform: "translateY(-2px)" }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => router.push(`/admin/franchises/${franchise.id}/gyms/${gym.id}`)}
            >
              <CardBody>
                <Flex justify="space-between" align="start" mb={4}>
                  <VStack align="start" spacing={1}>
                    <Heading color="white" size="md">{gym.name}</Heading>
                    <Text color="gray.400" fontSize="sm">{gym.city}</Text>
                    <Text color="gray.500" fontSize="xs">/{gym.slug}</Text>
                  </VStack>
                  <Badge colorScheme={gym.is_active ? "green" : "red"}>
                    {gym.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Flex>

                <VStack spacing={3} align="stretch">
                  <Flex justify="space-between">
                    <Text color="gray.400" fontSize="sm">Membres:</Text>
                    <Text color="white" fontSize="sm" fontWeight="bold">
                      {gym._count.memberships}
                    </Text>
                  </Flex>

                  <HStack spacing={2} justify="end">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      leftIcon={<Icon as={FiSettings} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/franchises/${franchise.id}/gyms/${gym.id}/edit`)
                      }}
                    >
                      Config
                    </Button>
                    <Button 
                      size="sm" 
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/franchises/${franchise.id}/gyms/${gym.id}`)
                      }}
                    >
                      Détails
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </Box>
  )
}
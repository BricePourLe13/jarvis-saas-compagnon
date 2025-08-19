/**
 * 🔥 SUPER ADMIN DASHBOARD V2
 * Architecture propre - Vue franchises
 */

'use client'

import { useEffect, useState } from 'react'
import { Box, Grid, Card, CardBody, Heading, Text, Badge, Button, Flex, Stat, StatLabel, StatNumber, StatHelpText, Icon, HStack, VStack } from '@chakra-ui/react'
import { FiBuilding, FiMapPin, FiUsers, FiActivity, FiDollarSign, FiTrendingUp } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { Franchise } from '../../../generated/prisma'

interface FranchiseWithStats extends Franchise {
  gyms: Array<{
    id: string
    name: string
    city: string
    is_active: boolean
    _count: { memberships: number }
  }>
  owner: {
    id: string
    name: string | null
    email: string
  }
  _count: { gyms: number }
  stats?: {
    total_members: number
    active_gyms: number
    monthly_revenue: number
  }
}

export default function SuperAdminDashboard() {
  const [franchises, setFranchises] = useState<FranchiseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState({
    total_franchises: 0,
    total_gyms: 0,
    total_members: 0,
    active_sessions: 0
  })
  const router = useRouter()

  useEffect(() => {
    loadFranchises()
  }, [])

  const loadFranchises = async () => {
    try {
      const response = await fetch('/api/admin/franchises')
      if (response.ok) {
        const data = await response.json()
        setFranchises(data.franchises)
        
        // Calculer stats globales
        const totalGyms = data.franchises.reduce((sum: number, f: FranchiseWithStats) => sum + f._count.gyms, 0)
        const totalMembers = data.franchises.reduce((sum: number, f: FranchiseWithStats) => 
          sum + f.gyms.reduce((gymSum, gym) => gymSum + gym._count.memberships, 0), 0
        )
        
        setGlobalStats({
          total_franchises: data.franchises.length,
          total_gyms: totalGyms,
          total_members: totalMembers,
          active_sessions: 0 // TODO: Implémenter avec Prisma
        })
      }
    } catch (error) {
      console.error('❌ Erreur chargement franchises:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box p={8}>
        <Heading color="white" mb={6}>🔥 JARVIS Super Admin</Heading>
        <Text color="gray.400">Chargement des franchises...</Text>
      </Box>
    )
  }

  return (
    <Box p={8} bg="black" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={1}>
          <Heading color="white" size="xl">🔥 JARVIS Super Admin</Heading>
          <Text color="gray.400">Gestion complète de l'écosystème SaaS</Text>
        </VStack>
        
        <Button 
          colorScheme="blue" 
          onClick={() => router.push('/admin/franchises/create')}
          leftIcon={<Icon as={FiBuilding} />}
        >
          Nouvelle Franchise
        </Button>
      </Flex>

      {/* Stats Globales */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={8}>
        <Card bg="gray.900" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">
                <HStack>
                  <Icon as={FiBuilding} />
                  <Text>Franchises</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white" fontSize="3xl">{globalStats.total_franchises}</StatNumber>
              <StatHelpText color="green.400">
                <Icon as={FiTrendingUp} mr={1} />
                Écosystème actif
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.900" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">
                <HStack>
                  <Icon as={FiMapPin} />
                  <Text>Salles Total</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white" fontSize="3xl">{globalStats.total_gyms}</StatNumber>
              <StatHelpText color="blue.400">Réseau national</StatHelpText>
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
              <StatNumber color="white" fontSize="3xl">{globalStats.total_members.toLocaleString()}</StatNumber>
              <StatHelpText color="purple.400">Utilisateurs actifs</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.900" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">
                <HStack>
                  <Icon as={FiActivity} />
                  <Text>Sessions Live</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="white" fontSize="3xl">{globalStats.active_sessions}</StatNumber>
              <StatHelpText color="green.400">JARVIS en temps réel</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Franchises Grid */}
      <Heading color="white" size="lg" mb={6}>🏢 Franchises Réseau</Heading>
      
      {franchises.length === 0 ? (
        <Card bg="gray.900" borderColor="gray.700">
          <CardBody textAlign="center" py={12}>
            <Text color="gray.400" fontSize="lg" mb={4}>Aucune franchise configurée</Text>
            <Button 
              colorScheme="blue" 
              onClick={() => router.push('/admin/franchises/create')}
            >
              Créer la première franchise
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
          {franchises.map((franchise) => {
            const totalMembers = franchise.gyms.reduce((sum, gym) => sum + gym._count.memberships, 0)
            const activeGyms = franchise.gyms.filter(gym => gym.is_active).length
            
            return (
              <Card 
                key={franchise.id} 
                bg="gray.900" 
                borderColor="gray.700" 
                _hover={{ borderColor: "blue.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => router.push(`/admin/franchises/${franchise.id}`)}
              >
                <CardBody>
                  <Flex justify="space-between" align="start" mb={4}>
                    <VStack align="start" spacing={1}>
                      <Heading color="white" size="md">{franchise.name}</Heading>
                      <Text color="gray.400" fontSize="sm">{franchise.city || 'Localisation non définie'}</Text>
                    </VStack>
                    <Badge colorScheme={activeGyms > 0 ? "green" : "gray"}>
                      {activeGyms} active{activeGyms > 1 ? 's' : ''}
                    </Badge>
                  </Flex>

                  <VStack spacing={3} align="stretch">
                    {/* Owner */}
                    <Flex justify="space-between">
                      <Text color="gray.400" fontSize="sm">Propriétaire:</Text>
                      <Text color="white" fontSize="sm">{franchise.owner.name || franchise.owner.email}</Text>
                    </Flex>

                    {/* Stats */}
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <Box textAlign="center">
                        <Text color="blue.400" fontSize="2xl" fontWeight="bold">{franchise._count.gyms}</Text>
                        <Text color="gray.400" fontSize="xs">Salles</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text color="purple.400" fontSize="2xl" fontWeight="bold">{totalMembers}</Text>
                        <Text color="gray.400" fontSize="xs">Membres</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text color="green.400" fontSize="2xl" fontWeight="bold">{activeGyms}</Text>
                        <Text color="gray.400" fontSize="xs">Actives</Text>
                      </Box>
                    </Grid>

                    {/* Salles Preview */}
                    {franchise.gyms.length > 0 && (
                      <Box>
                        <Text color="gray.400" fontSize="sm" mb={2}>Salles principales:</Text>
                        <VStack spacing={1} align="stretch">
                          {franchise.gyms.slice(0, 3).map((gym) => (
                            <Flex key={gym.id} justify="space-between" align="center">
                              <Text color="white" fontSize="sm">{gym.name}</Text>
                              <HStack spacing={2}>
                                <Text color="gray.400" fontSize="xs">{gym.city}</Text>
                                <Badge size="sm" colorScheme={gym.is_active ? "green" : "gray"}>
                                  {gym._count.memberships} membres
                                </Badge>
                              </HStack>
                            </Flex>
                          ))}
                          {franchise.gyms.length > 3 && (
                            <Text color="gray.500" fontSize="xs" textAlign="center">
                              +{franchise.gyms.length - 3} autres salles...
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}
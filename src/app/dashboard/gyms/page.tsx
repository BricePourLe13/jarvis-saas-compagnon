/**
 * 🏋️ TOUTES LES SALLES DE SPORT
 * Vue d'ensemble de toutes les salles (toutes franchises)
 */

'use client'

import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import {
  Dumbbell,
  MapPin,
  Users,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'
import SafeLink from '@/components/common/SafeLink'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

interface Gym {
  id: string
  name: string
  franchise_id: string
  franchise_name: string
  city: string
  address: string
  status: string
  members_count: number
}

export default function AllGymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadGyms()
  }, [])

  const loadGyms = async () => {
    try {
      const supabase = getSupabaseSingleton()

      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select(`
          id,
          name,
          franchise_id,
          city,
          address,
          status,
          gym_members (id)
        `)
        .order('created_at', { ascending: false })

      if (gymsError) throw gymsError

      const enrichedGyms: Gym[] = (gymsData || []).map(g => ({
        id: g.id,
        name: g.name,
        franchise_id: g.franchise_id,
        franchise_name: 'Franchise', // À enrichir avec une jointure
        city: g.city || 'Ville non renseignée',
        address: g.address || 'Adresse non renseignée',
        status: g.status || 'active',
        members_count: (g.gym_members || []).length
      }))

      setGyms(enrichedGyms)
    } catch (error) {
      console.error('Erreur chargement salles:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'maintenance': return 'orange'
      case 'suspended': return 'red'
      default: return 'gray'
    }
  }

  return (
    <SentryDashboardLayout
      title="Toutes les Salles de Sport"
      subtitle={`${gyms.length} salles au total`}
      showFilters={true}
    >
      <Box p={6}>
        <VStack spacing={8} align="stretch">
          
          {/* Statistiques */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Total Salles</StatLabel>
                  <StatNumber color="blue.600">{gyms.length}</StatNumber>
                  <StatHelpText>
                    Toutes franchises confondues
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Membres Total</StatLabel>
                  <StatNumber color="green.600">
                    {gyms.reduce((sum, g) => sum + g.members_count, 0)}
                  </StatNumber>
                  <StatHelpText>
                    Adhérents actifs
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Salles Actives</StatLabel>
                  <StatNumber color="purple.600">
                    {gyms.filter(g => g.status === 'active').length}
                  </StatNumber>
                  <StatHelpText>
                    En fonctionnement
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Liste des salles */}
          <Card>
            <CardHeader>
              <Text fontSize="lg" fontWeight="bold">Toutes les Salles</Text>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {gyms.map(gym => (
                  <SafeLink key={gym.id} href={`/dashboard/franchises/${gym.franchise_id}/gyms/${gym.id}`}>
                    <Card
                      cursor="pointer"
                      _hover={{
                        shadow: 'md',
                        transform: 'translateY(-2px)'
                      }}
                      transition="all 0.2s"
                    >
                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <Text fontWeight="bold" fontSize="lg">
                              {gym.name}
                            </Text>
                            <Badge colorScheme={getStatusColor(gym.status)}>
                              {gym.status}
                            </Badge>
                          </HStack>
                          
                          <HStack color="gray.600" fontSize="sm">
                            <MapPin size={14} />
                            <Text>{gym.city}</Text>
                          </HStack>

                          <HStack color="gray.600" fontSize="sm">
                            <Users size={14} />
                            <Text>{gym.members_count} membres</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SafeLink>
                ))}
              </SimpleGrid>

              {gyms.length === 0 && !loading && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertTitle>Aucune salle trouvée</AlertTitle>
                  <AlertDescription>
                    Commencez par créer votre première franchise et salle de sport.
                  </AlertDescription>
                </Alert>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </SentryDashboardLayout>
  )
}



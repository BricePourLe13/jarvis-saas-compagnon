'use client'

import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  Badge,
  Button,
  useColorModeValue,
  Icon,
  Avatar,
  AvatarGroup,
} from '@chakra-ui/react'
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  ArrowRight
} from 'lucide-react'

type DashboardContentProps = {
  overview?: any
  loading?: boolean
}

export default function DashboardContent({ overview, loading = false }: DashboardContentProps) {
  if (loading) {
    return (
      <Box p={6}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {[1, 2, 3, 4].map(i => (
            <Box key={i} bg="white" p={6} borderRadius="12px" border="1px solid" borderColor="gray.200" shadow="sm">
              <VStack h="120px" justify="center">
                <Text color="gray.500">Chargement...</Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    )
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        
        {/* Métriques principales en premier */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {/* Satisfaction */}
          <Box bg="white" shadow="sm" border="1px solid" borderColor="gray.200" p={6} borderRadius="12px">
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Icon as={TrendingUp} w={5} h={5} color="blue.500" />
                <Badge colorScheme="green" variant="subtle" size="sm">
                  +5.2%
                </Badge>
              </HStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500" fontWeight="500">
                  Satisfaction Membres
                </Text>
                <Heading size="xl" color="blue.500">
                  {Math.round(overview?.satisfaction_score || 0)}%
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  Objectif: 85% • Réseau: 78%
                </Text>
              </VStack>
              
              <Progress 
                value={overview?.satisfaction_score || 0} 
                colorScheme="blue" 
                size="sm" 
                borderRadius="full"
                bg="gray.100"
              />
            </VStack>
          </Box>

          {/* Activité */}
          <Box bg="white" shadow="sm" border="1px solid" borderColor="gray.200" p={6} borderRadius="12px">
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Icon as={MessageSquare} w={5} h={5} color="purple.500" />
                <Badge colorScheme="purple" variant="subtle" size="sm">
                  Actif
                </Badge>
              </HStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500" fontWeight="500">
                  Conversations Aujourd'hui
                </Text>
                <Heading size="xl" color="purple.500">
                  {overview?.sessions_today || 0}
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  {overview?.active_sessions || 0} en cours
                </Text>
              </VStack>
              
              <HStack spacing={1}>
                <Badge size="xs" colorScheme="blue">Nutrition</Badge>
                <Badge size="xs" colorScheme="green">Programme</Badge>
                <Badge size="xs" colorScheme="orange">Conseil</Badge>
              </HStack>
            </VStack>
          </Box>

          {/* Membres */}
          <Box bg="white" shadow="sm" border="1px solid" borderColor="gray.200" p={6} borderRadius="12px">
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Icon as={Users} w={5} h={5} color="green.500" />
                <AvatarGroup size="xs" max={3}>
                  <Avatar name="Marie" bg="pink.500" />
                  <Avatar name="Paul" bg="blue.500" />
                  <Avatar name="Sophie" bg="purple.500" />
                </AvatarGroup>
              </HStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500" fontWeight="500">
                  Membres Actifs (7j)
                </Text>
                <Heading size="xl" color="green.500">
                  84
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  12 nouveaux cette semaine
                </Text>
              </VStack>
              
              <Progress 
                value={84} 
                colorScheme="green" 
                size="sm" 
                borderRadius="full"
                bg="gray.100"
              />
            </VStack>
          </Box>

          {/* Status/Actions */}
          <Box 
            bg={overview?.alerts_count > 0 ? "red.50" : "white"}
            shadow="sm" 
            border="1px solid" 
            borderColor={overview?.alerts_count > 0 ? "red.200" : "gray.200"} 
            p={6} 
            borderRadius="12px"
          >
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Icon 
                  as={overview?.alerts_count > 0 ? AlertTriangle : Target}
                  w={5} 
                  h={5} 
                  color={overview?.alerts_count > 0 ? "red.500" : "green.500"}
                />
                <Badge 
                  colorScheme={overview?.alerts_count > 0 ? 'red' : 'green'}
                  variant="solid" 
                  size="sm"
                >
                  {overview?.alerts_count > 0 ? overview.alerts_count : '0'}
                </Badge>
              </HStack>
              
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500" fontWeight="500">
                  {overview?.alerts_count > 0 ? 'Alertes Critiques' : 'Statut Système'}
                </Text>
                <Heading size="xl" color={overview?.alerts_count > 0 ? "red.500" : "green.500"}>
                  {overview?.alerts_count > 0 ? 'Action' : 'OK'}
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  JARVIS {overview?.kiosk_status?.toUpperCase() || 'OFFLINE'}
                </Text>
              </VStack>
              
              {overview?.alerts_count > 0 && (
                <Button 
                  size="sm" 
                  colorScheme="red" 
                  variant="outline"
                  rightIcon={<Icon as={ArrowRight} w={4} h={4} />}
                >
                  Voir problèmes
                </Button>
              )}
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Actions Details */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recommandations IA */}
          <Box bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="12px">
            <VStack spacing={4} align="stretch" p={6}>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color="black">Recommandations IA</Heading>
                  <Text fontSize="sm" color="gray.500">Actions suggérées pour améliorer votre salle</Text>
                </VStack>
                <Badge colorScheme="blue" variant="outline">Intelligent</Badge>
              </HStack>
              
              <VStack spacing={3} align="stretch">
                {[
                  { 
                    title: "Contacter Marie Dubois", 
                    desc: "N'est pas venue depuis 5 jours, semble démotivée",
                    priority: "high",
                    time: "5min"
                  },
                  { 
                    title: "Vérifier équipement cardio", 
                    desc: "3 mentions négatives cette semaine",
                    priority: "medium",
                    time: "15min"
                  },
                  { 
                    title: "Mettre à jour programme débutants", 
                    desc: "Beaucoup de questions sur les bases",
                    priority: "low",
                    time: "30min"
                  }
                ].map((action, i) => (
                  <Box key={i} p={3} bg="gray.50" borderRadius="8px" border="1px solid" borderColor="gray.100">
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="medium" color="black">
                            {action.title}
                          </Text>
                          <Badge 
                            size="xs" 
                            colorScheme={action.priority === 'high' ? 'red' : action.priority === 'medium' ? 'orange' : 'gray'}
                          >
                            {action.priority === 'high' ? 'Urgent' : action.priority === 'medium' ? 'Important' : 'Normal'}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">{action.desc}</Text>
                        <HStack spacing={1}>
                          <Icon as={Clock} w={3} h={3} color="gray.400" />
                          <Text fontSize="xs" color="gray.400">{action.time}</Text>
                        </HStack>
                      </VStack>
                      <Button size="xs" variant="outline" colorScheme="blue">
                        Action
                      </Button>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </VStack>
          </Box>

          {/* Insights Membres */}
          <Box bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="12px">
            <VStack spacing={4} align="stretch" p={6}>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color="text.default">Insights Membres</Heading>
                  <Text fontSize="sm" color="text.muted">Tendances et comportements détectés</Text>
                </VStack>
                <Badge colorScheme="green" variant="outline">Temps réel</Badge>
              </HStack>
              
              <VStack spacing={3} align="stretch">
                {[
                  {
                    type: "positive",
                    message: "Sophie Martin très satisfaite du nouveau programme",
                    time: "Il y a 15min"
                  },
                  {
                    type: "info", 
                    message: "Pic d'activité détecté entre 18h-19h",
                    time: "Il y a 1h"
                  },
                  {
                    type: "warning",
                    message: "Questions fréquentes sur la nutrition",
                    time: "Il y a 2h"
                  }
                ].map((insight, i) => (
                  <HStack key={i} spacing={3} p={3} bg="gray.50" borderRadius="8px">
                    <Icon 
                      as={insight.type === 'positive' ? CheckCircle : insight.type === 'warning' ? AlertTriangle : MessageSquare}
                      w={4} 
                      h={4} 
                      color={insight.type === 'positive' ? 'green.500' : insight.type === 'warning' ? 'orange.500' : 'blue.500'}
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="sm" color="text.default">{insight.message}</Text>
                      <Text fontSize="xs" color="text.muted">{insight.time}</Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Box>
  )
}
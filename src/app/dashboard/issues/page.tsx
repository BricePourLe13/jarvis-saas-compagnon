/**
 * 🚨 ISSUES & ALERTS PAGE
 * Centralisation de toutes les issues système
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import SentryDashboardLayout from '@/components/dashboard/SentryDashboardLayout'
import SafeLink from '@/components/common/SafeLink'

interface Issue {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  gym_name?: string
  franchise_name?: string
  timestamp: Date
  resolved: boolean
  assignee?: string
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIssues()
  }, [])

  const loadIssues = async () => {
    // Simulé pour l'instant
    const mockIssues: Issue[] = [
      {
        id: '1',
        type: 'critical',
        title: 'Kiosk Offline',
        description: 'Le kiosk ne répond plus depuis 5 minutes',
        gym_name: 'Salle Test',
        franchise_name: 'Orange Bleue',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        resolved: false
      },
      {
        id: '2',
        type: 'warning',
        title: 'Coût IA Élevé',
        description: 'Coût horaire: €12.50 (seuil: €10)',
        gym_name: 'JARVIS Demo Gym',
        franchise_name: 'Orange Bleue',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        resolved: false
      }
    ]

    setIssues(mockIssues)
    setLoading(false)
  }

  const getIssueColor = (type: Issue['type']) => {
    switch (type) {
      case 'critical': return 'red'
      case 'warning': return 'orange'
      case 'info': return 'blue'
    }
  }

  const criticalCount = issues.filter(i => i.type === 'critical' && !i.resolved).length
  const warningCount = issues.filter(i => i.type === 'warning' && !i.resolved).length
  const resolvedCount = issues.filter(i => i.resolved).length

  return (
    <SentryDashboardLayout
      title="Issues & Alertes"
      subtitle="Centralisation de toutes les alertes système"
      showFilters={true}
    >
      <Box p={6}>
        <VStack spacing={8} align="stretch">
          
          {/* Statistiques */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Issues Critiques</StatLabel>
                  <StatNumber color="red.600">{criticalCount}</StatNumber>
                  <StatHelpText>
                    Nécessitent une action immédiate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Avertissements</StatLabel>
                  <StatNumber color="orange.600">{warningCount}</StatNumber>
                  <StatHelpText>
                    À surveiller
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel color="gray.600">Résolues</StatLabel>
                  <StatNumber color="green.600">{resolvedCount}</StatNumber>
                  <StatHelpText>
                    Dernières 24h
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Liste des issues */}
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Toutes les Issues</Text>
                <Button leftIcon={<Filter size={16} />} size="sm" variant="outline">
                  Filtrer
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Tabs>
                <TabList>
                  <Tab>Non Résolues ({issues.filter(i => !i.resolved).length})</Tab>
                  <Tab>Résolues ({resolvedCount})</Tab>
                  <Tab>Toutes</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel px={0}>
                    <VStack spacing={3} align="stretch">
                      {issues.filter(i => !i.resolved).map(issue => (
                        <SafeLink key={issue.id} href={`/dashboard/issues/${issue.id}`}>
                          <Box
                            p={4}
                            borderRadius="md"
                            border="1px"
                            borderColor="gray.200"
                            _hover={{ borderColor: 'blue.300', bg: 'blue.50' }}
                            cursor="pointer"
                            transition="all 0.2s"
                          >
                            <HStack spacing={3}>
                              <Icon 
                                as={AlertTriangle} 
                                color={`${getIssueColor(issue.type)}.500`} 
                                boxSize={5}
                              />
                              <VStack align="start" spacing={1} flex={1}>
                                <HStack justify="space-between" w="full">
                                  <Text fontWeight="medium">
                                    {issue.title}
                                  </Text>
                                  <Badge colorScheme={getIssueColor(issue.type)}>
                                    {issue.type}
                                  </Badge>
                                </HStack>
                                <Text fontSize="sm" color="gray.600">
                                  {issue.description}
                                </Text>
                                {(issue.gym_name || issue.franchise_name) && (
                                  <HStack spacing={2}>
                                    {issue.gym_name && (
                                      <Badge colorScheme="gray" size="sm">
                                        {issue.gym_name}
                                      </Badge>
                                    )}
                                    {issue.franchise_name && (
                                      <Badge colorScheme="blue" size="sm">
                                        {issue.franchise_name}
                                      </Badge>
                                    )}
                                  </HStack>
                                )}
                              </VStack>
                            </HStack>
                          </Box>
                        </SafeLink>
                      ))}
                      
                      {issues.filter(i => !i.resolved).length === 0 && (
                        <Alert status="success" borderRadius="md">
                          <AlertIcon />
                          <AlertTitle>Aucune issue non résolue !</AlertTitle>
                          <AlertDescription>
                            Tous les systèmes fonctionnent normalement.
                          </AlertDescription>
                        </Alert>
                      )}
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <AlertTitle>Issues résolues</AlertTitle>
                      <AlertDescription>
                        Consultez l'historique des issues résolues.
                      </AlertDescription>
                    </Alert>
                  </TabPanel>

                  <TabPanel px={0}>
                    <Text color="gray.600">Toutes les issues (résolues et non résolues)</Text>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </SentryDashboardLayout>
  )
}


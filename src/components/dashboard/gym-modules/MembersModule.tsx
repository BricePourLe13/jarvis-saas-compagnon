/**
 * 👥 MODULE MEMBERS - GESTION ADHÉRENTS
 * Segments automatiques, recherche avancée, drill-down profils
 */

'use client'

import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tag,
  TagLabel,
  TagLeftIcon,
  Icon
} from '@chakra-ui/react'
import {
  Search,
  Filter,
  Users,
  AlertTriangle,
  TrendingDown,
  Star,
  Eye,
  Edit,
  MessageSquare,
  Download,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Target,
  Heart,
  Zap,
  DollarSign,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// ===========================================
// 🎯 TYPES & INTERFACES
// ===========================================

interface Member {
  id: string
  badgeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  profilePhotoUrl?: string
  membershipType: string
  memberSince: Date
  lastVisit: Date | null
  status: 'active' | 'at_risk' | 'critical' | 'inactive'
  
  // Scores IA
  loyaltyScore: number
  satisfactionScore: number
  churnProbability: number
  engagementLevel: 'high' | 'medium' | 'low'
  
  // Stats
  totalSessions: number
  avgSessionDuration: number
  lastSessionSentiment: number
  favoriteTopics: string[]
  
  // Recommandations IA
  aiRecommendation?: string
  aiPriority: 'urgent' | 'important' | 'normal'
}

interface MemberSegment {
  id: string
  name: string
  description: string
  count: number
  color: string
  icon: any
  filter: (member: Member) => boolean
}

interface FilterState {
  search: string
  status: string
  churnRisk: string
  membershipType: string
  lastVisit: string
}

// ===========================================
// 🎨 SEGMENTS AUTOMATIQUES
// ===========================================

const MEMBER_SEGMENTS: MemberSegment[] = [
  {
    id: 'at_risk',
    name: 'À Risque',
    description: 'Membres avec forte probabilité de churn',
    count: 0,
    color: 'red',
    icon: AlertTriangle,
    filter: (member) => member.churnProbability > 60
  },
  {
    id: 'inactive',
    name: 'Inactifs',
    description: 'Aucune visite depuis 30+ jours',
    count: 0,
    color: 'orange',
    icon: TrendingDown,
    filter: (member) => {
      if (!member.lastVisit) return true
      const daysSinceVisit = (Date.now() - member.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceVisit > 30
    }
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Membres premium très engagés',
    count: 0,
    color: 'purple',
    icon: Star,
    filter: (member) => member.loyaltyScore > 80 && member.engagementLevel === 'high'
  },
  {
    id: 'new',
    name: 'Nouveaux',
    description: 'Membres inscrits récemment',
    count: 0,
    color: 'green',
    icon: UserCheck,
    filter: (member) => {
      const daysSinceMember = (Date.now() - member.memberSince.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceMember <= 30
    }
  }
]

// ===========================================
// 🎨 COMPOSANT SEGMENTS
// ===========================================

function MemberSegmentsPanel({ 
  members, 
  selectedSegment, 
  onSegmentSelect 
}: { 
  members: Member[]
  selectedSegment: string | null
  onSegmentSelect: (segmentId: string | null) => void 
}) {
  const segmentsWithCounts = MEMBER_SEGMENTS.map(segment => ({
    ...segment,
    count: members.filter(segment.filter).length
  }))

  return (
    <Card>
      <CardHeader>
        <HStack spacing={3}>
          <Users size={20} />
          <Text fontSize="lg" fontWeight="bold">Segments Automatiques</Text>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          {segmentsWithCounts.map(segment => (
            <Card
              key={segment.id}
              variant={selectedSegment === segment.id ? "solid" : "outline"}
              bg={selectedSegment === segment.id ? `${segment.color}.50` : "white"}
              borderColor={selectedSegment === segment.id ? `${segment.color}.200` : "gray.200"}
              cursor="pointer"
              _hover={{ shadow: "md" }}
              onClick={() => onSegmentSelect(selectedSegment === segment.id ? null : segment.id)}
            >
              <CardBody p={4} textAlign="center">
                <VStack spacing={2}>
                  <HStack spacing={2}>
                    <Icon as={segment.icon} size={16} color={`var(--chakra-colors-${segment.color}-500)`} />
                    <Badge colorScheme={segment.color} variant="solid">
                      {segment.count}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold">
                    {segment.name}
                  </Text>
                  <Text fontSize="xs" color="gray.600" textAlign="center">
                    {segment.description}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT FILTRES
// ===========================================

function MemberFiltersPanel({ 
  filters, 
  onFiltersChange,
  totalMembers,
  filteredCount
}: { 
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  totalMembers: number
  filteredCount: number
}) {
  return (
    <Card>
      <CardBody>
        <HStack spacing={4} wrap="wrap">
          
          {/* Recherche */}
          <InputGroup maxW="300px">
            <InputLeftElement>
              <Search size={16} color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher membre..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              size="sm"
            />
          </InputGroup>

          {/* Statut */}
          <Select
            placeholder="Tous les statuts"
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            size="sm"
            maxW="150px"
          >
            <option value="active">Actif</option>
            <option value="at_risk">À Risque</option>
            <option value="critical">Critique</option>
            <option value="inactive">Inactif</option>
          </Select>

          {/* Risque Churn */}
          <Select
            placeholder="Risque churn"
            value={filters.churnRisk}
            onChange={(e) => onFiltersChange({ ...filters, churnRisk: e.target.value })}
            size="sm"
            maxW="150px"
          >
            <option value="low">Faible (0-30%)</option>
            <option value="medium">Moyen (30-60%)</option>
            <option value="high">Élevé (60%+)</option>
          </Select>

          {/* Type Adhésion */}
          <Select
            placeholder="Type adhésion"
            value={filters.membershipType}
            onChange={(e) => onFiltersChange({ ...filters, membershipType: e.target.value })}
            size="sm"
            maxW="150px"
          >
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
            <option value="VIP">VIP</option>
          </Select>

          <Divider orientation="vertical" h="32px" />

          {/* Résultats */}
          <Text fontSize="sm" color="gray.600">
            <Text as="span" fontWeight="bold">{filteredCount}</Text> / {totalMembers} membres
          </Text>

          {/* Actions */}
          <Button size="sm" leftIcon={<Download size={14} />} variant="outline">
            Exporter
          </Button>

        </HStack>
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT TABLEAU MEMBRES
// ===========================================

function MembersTable({ 
  members, 
  onMemberSelect 
}: { 
  members: Member[]
  onMemberSelect: (member: Member) => void 
}) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'green'
      case 'at_risk': return 'orange'
      case 'critical': return 'red'
      case 'inactive': return 'gray'
    }
  }

  const getStatusLabel = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'at_risk': return 'À Risque'
      case 'critical': return 'Critique'
      case 'inactive': return 'Inactif'
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(m => m.id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId])
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId))
    }
  }

  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">
            Liste des Membres ({members.length})
          </Text>
          
          {selectedMembers.length > 0 && (
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.600">
                {selectedMembers.length} sélectionnés
              </Text>
              <Button size="sm" leftIcon={<Mail size={14} />} variant="outline">
                Email
              </Button>
              <Button size="sm" leftIcon={<MessageSquare size={14} />} variant="outline">
                Mission
              </Button>
            </HStack>
          )}
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Box overflowX="auto">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>
                  <Checkbox
                    isChecked={selectedMembers.length === members.length && members.length > 0}
                    isIndeterminate={selectedMembers.length > 0 && selectedMembers.length < members.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </Th>
                <Th>Membre</Th>
                <Th>Badge</Th>
                <Th>Statut</Th>
                <Th>Fidélité</Th>
                <Th>Churn</Th>
                <Th>Sessions</Th>
                <Th>Dernière Visite</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {members.slice(0, 50).map(member => (
                <Tr key={member.id} _hover={{ bg: "gray.50" }}>
                  <Td>
                    <Checkbox
                      isChecked={selectedMembers.includes(member.id)}
                      onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                    />
                  </Td>
                  <Td>
                    <HStack spacing={3}>
                      <Avatar size="sm" name={`${member.firstName} ${member.lastName}`} src={member.profilePhotoUrl} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {member.firstName} {member.lastName}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {member.membershipType}
                        </Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm" fontFamily="mono">
                      {member.badgeId}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(member.status)} size="sm">
                      {getStatusLabel(member.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                      {member.loyaltyScore}%
                    </Text>
                  </Td>
                  <Td>
                    <Text 
                      fontSize="sm" 
                      fontWeight="bold" 
                      color={member.churnProbability > 60 ? "red.600" : member.churnProbability > 30 ? "orange.600" : "green.600"}
                    >
                      {member.churnProbability}%
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {member.totalSessions}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {member.lastVisit ? member.lastVisit.toLocaleDateString() : 'Jamais'}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        aria-label="Voir profil"
                        icon={<Eye size={14} />}
                        size="xs"
                        variant="outline"
                        onClick={() => onMemberSelect(member)}
                      />
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Plus d'actions"
                          icon={<MoreVertical size={14} />}
                          size="xs"
                          variant="outline"
                        />
                        <MenuList>
                          <MenuItem icon={<Edit size={14} />}>
                            Modifier profil
                          </MenuItem>
                          <MenuItem icon={<MessageSquare size={14} />}>
                            Créer mission
                          </MenuItem>
                          <MenuItem icon={<Mail size={14} />}>
                            Envoyer email
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {members.length > 50 && (
          <Box mt={4} textAlign="center">
            <Button variant="outline" size="sm">
              Charger plus ({members.length - 50} restants)
            </Button>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}

// ===========================================
// 🎨 COMPOSANT PRINCIPAL
// ===========================================

export default function MembersModule({ gymId }: { gymId: string }) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    churnRisk: '',
    membershipType: '',
    lastVisit: ''
  })

  useEffect(() => {
    loadMembersData()
  }, [gymId])

  const loadMembersData = async () => {
    try {
      // Simuler le chargement
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock data - générer des membres réalistes
      const mockMembers: Member[] = Array.from({ length: 156 }, (_, i) => ({
        id: `member-${i + 1}`,
        badgeId: `BADGE${(i + 1).toString().padStart(3, '0')}`,
        firstName: ['Marie', 'Jean', 'Sophie', 'Pierre', 'Emma', 'Lucas', 'Camille', 'Thomas'][i % 8],
        lastName: ['Dubois', 'Martin', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel'][i % 8],
        email: `membre${i + 1}@example.com`,
        phone: Math.random() > 0.3 ? `06${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}` : undefined,
        membershipType: ['Standard', 'Premium', 'VIP'][Math.floor(Math.random() * 3)],
        memberSince: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastVisit: Math.random() > 0.1 ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) : null,
        status: Math.random() > 0.8 ? 'at_risk' : Math.random() > 0.95 ? 'critical' : Math.random() > 0.9 ? 'inactive' : 'active',
        loyaltyScore: Math.floor(Math.random() * 40) + 60,
        satisfactionScore: Math.random() * 2 + 3,
        churnProbability: Math.floor(Math.random() * 80) + 5,
        engagementLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        totalSessions: Math.floor(Math.random() * 100) + 5,
        avgSessionDuration: Math.floor(Math.random() * 10) + 4,
        lastSessionSentiment: Math.random() * 0.6 + 0.4,
        favoriteTopics: ['Cardio', 'Nutrition', 'Motivation', 'Musculation'].slice(0, Math.floor(Math.random() * 3) + 1),
        aiRecommendation: Math.random() > 0.6 ? 'Créer mission motivation personnalisée' : undefined,
        aiPriority: Math.random() > 0.8 ? 'urgent' : Math.random() > 0.6 ? 'important' : 'normal'
      }))

      setMembers(mockMembers)
    } catch (error) {
      console.error('Erreur chargement membres:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrage des membres
  const filteredMembers = useMemo(() => {
    let filtered = members

    // Segment sélectionné
    if (selectedSegment) {
      const segment = MEMBER_SEGMENTS.find(s => s.id === selectedSegment)
      if (segment) {
        filtered = filtered.filter(segment.filter)
      }
    }

    // Recherche textuelle
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(member =>
        `${member.firstName} ${member.lastName} ${member.badgeId} ${member.email}`
          .toLowerCase()
          .includes(search)
      )
    }

    // Filtres spécifiques
    if (filters.status) {
      filtered = filtered.filter(member => member.status === filters.status)
    }

    if (filters.churnRisk) {
      filtered = filtered.filter(member => {
        switch (filters.churnRisk) {
          case 'low': return member.churnProbability <= 30
          case 'medium': return member.churnProbability > 30 && member.churnProbability <= 60
          case 'high': return member.churnProbability > 60
          default: return true
        }
      })
    }

    if (filters.membershipType) {
      filtered = filtered.filter(member => member.membershipType === filters.membershipType)
    }

    return filtered
  }, [members, selectedSegment, filters])

  const handleMemberSelect = (member: Member) => {
    // Navigation vers le profil détaillé
    router.push(`/dashboard/franchises/franchise-1/gyms/${gymId}/members/${member.id}/sentry`)
  }

  if (loading) {
    return (
      <VStack spacing={4}>
        <Progress size="xs" isIndeterminate colorScheme="blue" />
        <Text color="gray.600">Chargement des membres...</Text>
      </VStack>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      
      {/* Segments Automatiques */}
      <MemberSegmentsPanel
        members={members}
        selectedSegment={selectedSegment}
        onSegmentSelect={setSelectedSegment}
      />

      {/* Filtres */}
      <MemberFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        totalMembers={members.length}
        filteredCount={filteredMembers.length}
      />

      {/* Tableau des Membres */}
      <MembersTable
        members={filteredMembers}
        onMemberSelect={handleMemberSelect}
      />

    </VStack>
  )
}

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Card,
  Title,
  Text,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
  TextInput,
  Select,
  SelectItem,
  Flex,
  CalloutText
} from '@tremor/react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

/**
 * 👥 DASHBOARD MEMBERS - Version Tremor Enterprise
 * Liste complète des membres avec search, filters et pagination
 */

interface Member {
  id: string
  badge_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  membership_type: string | null
  is_active: boolean
  last_visit: string | null
  total_visits: number
  member_since: string
  membership_expires: string | null
  gym_name: string
  churnRisk: 'high' | 'medium' | 'low'
}

function MembersV2Content() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filterChurn, setFilterChurn] = useState(searchParams.get('filter') || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  
  const membersPerPage = 10

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(
          `/api/dashboard/members-v2?search=${searchQuery}&filter=${filterChurn}&limit=${membersPerPage}&offset=${(currentPage - 1) * membersPerPage}`
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setMembers(data.members)
        setTotal(data.total)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMembers()
  }, [searchQuery, filterChurn, currentPage, membersPerPage])

  const totalPages = Math.ceil(total / membersPerPage)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFilter = (value: string) => {
    setFilterChurn(value)
    setCurrentPage(1)
  }

  const getChurnBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge color="red">Risque élevé</Badge>
      case 'medium':
        return <Badge color="amber">Risque moyen</Badge>
      default:
        return <Badge color="emerald">Actif</Badge>
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Chargement des membres...</Text>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <Flex alignItems="center" className="space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <div>
              <Title>Erreur de chargement</Title>
              <Text>{error}</Text>
            </div>
          </Flex>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Title>Membres</Title>
          <Text>Gérez vos {total} membres actifs</Text>
        </div>

        {/* Filters & Search */}
        <Card>
          <Flex justifyContent="between" className="space-x-4">
            <Flex className="space-x-2 flex-1">
              <TextInput
                icon={MagnifyingGlassIcon}
                placeholder="Rechercher par nom, prénom ou badge..."
                value={searchQuery}
                onValueChange={handleSearch}
                className="max-w-md"
              />
              
              <Select
                icon={FunnelIcon}
                value={filterChurn}
                onValueChange={handleFilter}
                className="max-w-xs"
              >
                <SelectItem value="all">Tous les membres</SelectItem>
                <SelectItem value="active">Actifs récents</SelectItem>
                <SelectItem value="inactive">Risque churn (14j+)</SelectItem>
                <SelectItem value="no-jarvis">Jamais utilisé JARVIS</SelectItem>
              </Select>
            </Flex>

            <Button
              icon={UserPlusIcon}
              variant="primary"
              onClick={() => router.push('/dashboard/members-v2/new')}
            >
              Nouveau membre
            </Button>
          </Flex>
        </Card>

        {/* Members Table */}
        <Card>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Text className="text-gray-500">Aucun membre trouvé</Text>
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Membre</TableHeaderCell>
                    <TableHeaderCell>Badge</TableHeaderCell>
                    <TableHeaderCell>Salle</TableHeaderCell>
                    <TableHeaderCell>Dernière visite</TableHeaderCell>
                    <TableHeaderCell>Visites totales</TableHeaderCell>
                    <TableHeaderCell>Statut</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Text className="font-medium">
                          {member.first_name} {member.last_name}
                        </Text>
                        {member.email && (
                          <Text className="text-xs text-gray-500">{member.email}</Text>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge color="gray">{member.badge_id}</Badge>
                      </TableCell>
                      <TableCell>
                        <Text>{member.gym_name}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{formatDate(member.last_visit)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text className="font-medium">{member.total_visits}</Text>
                      </TableCell>
                      <TableCell>
                        {getChurnBadge(member.churnRisk)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => router.push(`/dashboard/members-v2/${member.id}`)}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <Flex justifyContent="between" className="mt-6">
                  <Text className="text-gray-600">
                    Page {currentPage} sur {totalPages} ({total} membres)
                  </Text>
                  <Flex className="space-x-2">
                    <Button
                      size="xs"
                      variant="secondary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Précédent
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Suivant
                    </Button>
                  </Flex>
                </Flex>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function MembersV2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MembersV2Content />
    </Suspense>
  )
}

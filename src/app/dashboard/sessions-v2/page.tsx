'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Metric
} from '@tremor/react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

/**
 * 💬 DASHBOARD SESSIONS - Version Tremor Enterprise
 * Liste des conversations JARVIS avec sentiment et topics
 */

interface Session {
  id: string
  member: {
    firstName: string
    lastName: string
    badgeId: string
  }
  duration: number
  sentiment: 'positive' | 'neutral' | 'negative'
  createdAt: Date
  topics: string[]
  messagesCount: number
}

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('all')

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(
          `/api/dashboard/sessions-v2?search=${searchQuery}&sentiment=${filterSentiment}`
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setSessions(data.sessions.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt)
        })))
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessions()
  }, [searchQuery, filterSentiment])

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Badge color="emerald">Positif</Badge>
      case 'negative':
        return <Badge color="rose">Négatif</Badge>
      default:
        return <Badge color="gray">Neutre</Badge>
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Chargement des sessions...</Text>
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
          <Title>Sessions JARVIS</Title>
          <Text>{sessions.length} conversations enregistrées</Text>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card decoration="top" decorationColor="blue">
            <Flex alignItems="center" className="space-x-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
              <Text>Total sessions</Text>
            </Flex>
            <Metric className="mt-2">{sessions.length}</Metric>
          </Card>

          <Card decoration="top" decorationColor="emerald">
            <Flex alignItems="center" className="space-x-2">
              <ClockIcon className="h-6 w-6 text-emerald-600" />
              <Text>Durée moyenne</Text>
            </Flex>
            <Metric className="mt-2">
              {sessions.length > 0
                ? formatDuration(Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length))
                : '0:00'}
            </Metric>
          </Card>

          <Card decoration="top" decorationColor="rose">
            <Flex alignItems="center" className="space-x-2">
              <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
              <Text>Sessions négatives</Text>
            </Flex>
            <Metric className="mt-2">
              {sessions.filter(s => s.sentiment === 'negative').length}
            </Metric>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <Flex className="space-x-2">
            <TextInput
              icon={MagnifyingGlassIcon}
              placeholder="Rechercher par nom de membre..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 max-w-md"
            />
            
            <Select
              icon={FunnelIcon}
              value={filterSentiment}
              onValueChange={setFilterSentiment}
              className="max-w-xs"
            >
              <SelectItem value="all">Tous les sentiments</SelectItem>
              <SelectItem value="positive">Positif</SelectItem>
              <SelectItem value="neutral">Neutre</SelectItem>
              <SelectItem value="negative">Négatif</SelectItem>
            </Select>
          </Flex>
        </Card>

        {/* Sessions Table */}
        <Card>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Text className="text-gray-500">Aucune session trouvée</Text>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Membre</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Durée</TableHeaderCell>
                  <TableHeaderCell>Messages</TableHeaderCell>
                  <TableHeaderCell>Sentiment</TableHeaderCell>
                  <TableHeaderCell>Sujets</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Text className="font-medium">
                        {session.member.firstName} {session.member.lastName}
                      </Text>
                      <Text className="text-xs text-gray-500">{session.member.badgeId}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{formatDate(session.createdAt)}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color="gray">{formatDuration(session.duration)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Text>{session.messagesCount}</Text>
                    </TableCell>
                    <TableCell>
                      {getSentimentBadge(session.sentiment)}
                    </TableCell>
                    <TableCell>
                      <Flex className="space-x-1">
                        {session.topics.slice(0, 3).map((topic, idx) => (
                          <Badge key={idx} color="blue" size="xs">{topic}</Badge>
                        ))}
                        {session.topics.length > 3 && (
                          <Badge color="gray" size="xs">+{session.topics.length - 3}</Badge>
                        )}
                      </Flex>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                      >
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}

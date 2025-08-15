'use client'

import { useEffect, useState } from 'react'
import { Box, VStack, HStack, Text, Badge, Skeleton } from '@chakra-ui/react'

type NotificationItem = { id: string; title: string; message: string; severity: 'info'|'warning'|'critical'; created_at: string }

export default function NotificationsFeed({ gymId }: { gymId?: string }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const qs = gymId ? `?gymId=${encodeURIComponent(gymId)}` : ''
      const res = await fetch(`/api/manager/notifications${qs}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setItems(json.data || [])
      }
      setLoading(false)
    }
    load()
  }, [gymId])

  if (loading) return <VStack align="stretch" spacing={3}><Skeleton h="48px" /><Skeleton h="48px" /><Skeleton h="48px" /></VStack>

  if (!items.length) return <Text color="text.muted" fontSize="sm">Aucune notification</Text>

  const scheme = (sev: string) => sev === 'critical' ? 'red' : sev === 'warning' ? 'orange' : 'blue'

  return (
    <VStack align="stretch" spacing={3}>
      {items.map(n => (
        <HStack key={n.id} justify="space-between" p={3} bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="10px">
          <VStack align="start" spacing={0}>
            <HStack>
              <Badge colorScheme={scheme(n.severity)}>{n.severity.toUpperCase()}</Badge>
              <Text color="text.default" fontWeight="600">{n.title}</Text>
            </HStack>
            <Text color="text.muted" fontSize="sm">{n.message}</Text>
          </VStack>
          <Text color="text.muted" fontSize="xs">{new Date(n.created_at).toLocaleString()}</Text>
        </HStack>
      ))}
    </VStack>
  )
}



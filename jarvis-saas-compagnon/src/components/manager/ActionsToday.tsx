'use client'

import { useEffect, useState } from 'react'
import { Box, VStack, HStack, Text, Button, Badge, Skeleton } from '@chakra-ui/react'

type ActionItem = { id: string; title: string; type: string; state: 'pending'|'completed'|'ignored'; created_at: string }

export default function ActionsToday({ gymId }: { gymId?: string }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ActionItem[]>([])

  const load = async () => {
    setLoading(true)
    const qs = gymId ? `?gymId=${encodeURIComponent(gymId)}` : ''
    const res = await fetch(`/api/manager/actions${qs}`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      setItems(json.data || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [gymId])

  const update = async (id: string, state: 'completed'|'ignored') => {
    await fetch('/api/manager/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: id, state })
    })
    load()
  }

  if (loading) return <VStack align="stretch" spacing={3}><Skeleton h="60px" /><Skeleton h="60px" /><Skeleton h="60px" /></VStack>

  if (!items.length) return <Text color="text.muted" fontSize="sm">Aucune action pour aujourd'hui</Text>

  return (
    <VStack align="stretch" spacing={3}>
      {items.map(a => (
        <HStack key={a.id} justify="space-between" p={3} bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="10px">
          <VStack align="start" spacing={0}>
            <Text color="text.default" fontWeight="600">{a.title}</Text>
            <HStack>
              <Badge colorScheme={a.state === 'completed' ? 'green' : a.state === 'ignored' ? 'gray' : 'blue'}>{a.state}</Badge>
              <Text color="text.muted" fontSize="xs">{new Date(a.created_at).toLocaleString()}</Text>
            </HStack>
          </VStack>
          <HStack>
            <Button size="sm" variant="outline" onClick={() => update(a.id, 'ignored')}>Ignorer</Button>
            <Button size="sm" colorScheme="purple" onClick={() => update(a.id, 'completed')}>Fait</Button>
          </HStack>
        </HStack>
      ))}
    </VStack>
  )
}



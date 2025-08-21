'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Box, Spinner, VStack, Text } from '@chakra-ui/react'
import { createBrowserClientWithConfig } from '@/lib/supabase-admin'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createBrowserClientWithConfig()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/setup')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (!profile) {
        router.push('/auth/setup')
        return
      }

      // Vérifier les permissions admin
      if (!['super_admin', 'franchise_owner'].includes(profile.role)) {
        router.push('/')
        return
      }

      // 2FA obligatoire pour admins/owners: rediriger vers l'enrôlement si requis
      if (profile.mfa_required && !profile.mfa_enrolled && pathname !== '/auth/mfa') {
        router.push('/auth/mfa')
        return
      }

      setUser(profile)
    } catch (error) {
      // Log supprimé pour production
      router.push('/auth/setup')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box 
        minH="100vh" 
        bg="gray.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="lg" color="black" />
          <Text color="gray.600" fontSize="sm">
            Vérification des permissions...
          </Text>
        </VStack>
      </Box>
    )
  }

  if (!user) {
    return null
  }

  // Le layout est maintenant géré par chaque page via UnifiedLayout
  return <>{children}</>
}
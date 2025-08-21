"use client"
import {
  HStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  Icon,
  Badge,
  Box
} from '@chakra-ui/react'
import { ChevronRight, Home, Building2, Dumbbell } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface BreadcrumbLevel {
  level: 'global' | 'franchise' | 'gym'
  id?: string
  name: string
  href: string
}

interface LevelBreadcrumbProps {
  levels: BreadcrumbLevel[]
  currentPage?: string
}

export function LevelBreadcrumb({ levels, currentPage }: LevelBreadcrumbProps) {
  const router = useRouter()

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'global': return Home
      case 'franchise': return Building2
      case 'gym': return Dumbbell
      default: return Home
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'global': return 'blue'
      case 'franchise': return 'purple'
      case 'gym': return 'green'
      default: return 'gray'
    }
  }

  return (
    <Box>
      <Breadcrumb 
        spacing={2} 
        separator={<Icon as={ChevronRight} boxSize={4} color="gray.400" />}
        fontSize="sm"
      >
        {levels.map((level, index) => {
          const isLast = index === levels.length - 1
          const LevelIcon = getLevelIcon(level.level)
          const colorScheme = getLevelColor(level.level)

          return (
            <BreadcrumbItem key={`${level.level}:${level.href}:${level.name}`} isCurrentPage={isLast}>
              <BreadcrumbLink
                onClick={() => router.push(level.href)}
                color={isLast ? "black" : "gray.600"}
                fontWeight={isLast ? "500" : "400"}
                cursor="pointer"
                _hover={{ color: isLast ? "black" : "gray.800" }}
              >
                <HStack spacing={2} align="center">
                  <Icon as={LevelIcon} boxSize={4} />
                  <Text>{level.name}</Text>
                  <Badge
                    size="sm"
                    colorScheme={colorScheme}
                    variant="subtle"
                    fontSize="2xs"
                    textTransform="uppercase"
                  >
                    {level.level}
                  </Badge>
                </HStack>
              </BreadcrumbLink>
            </BreadcrumbItem>
          )
        })}
        
        {currentPage && (
          <BreadcrumbItem isCurrentPage>
            <Text color="gray.500" fontSize="sm">
              {currentPage}
            </Text>
          </BreadcrumbItem>
        )}
      </Breadcrumb>
    </Box>
  )
}
"use client"
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  Badge,
  Text,
  VStack,
  HStack,
  Icon,
  Tooltip
} from '@chakra-ui/react'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

const MotionTr = motion(Tr)

export interface TableColumn {
  key: string
  label: string
  width?: string
  render?: (value: any, row: any) => React.ReactNode
}

export interface MonitoringTableProps {
  columns: TableColumn[]
  data: any[]
  level: 'global' | 'franchise' | 'gym'
  title: string
  onRowClick?: (row: any) => void
  showAvatar?: boolean
  avatarKey?: string
  nameKey?: string
}

export function MonitoringTable({
  columns,
  data,
  level,
  title,
  onRowClick,
  showAvatar = true,
  avatarKey = 'name',
  nameKey = 'name'
}: MonitoringTableProps) {

  const getLevelColors = (level: string) => {
    switch (level) {
      case 'global': return { header: 'blue.50', border: 'blue.100' }
      case 'franchise': return { header: 'purple.50', border: 'purple.100' }
      case 'gym': return { header: 'green.50', border: 'green.100' }
      default: return { header: 'gray.50', border: 'gray.100' }
    }
  }

  const levelColors = getLevelColors(level)

  const getStatusIcon = (status: string): LucideIcon => {
    const { Activity, Wifi, WifiOff, CheckCircle, AlertTriangle } = require('lucide-react')
    switch (status) {
      case 'online': return Wifi
      case 'active': return Activity
      case 'completed': return CheckCircle
      case 'offline': return WifiOff
      case 'error': return AlertTriangle
      default: return CheckCircle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green'
      case 'active': return 'blue'
      case 'completed': return 'gray'
      case 'offline': return 'red'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const renderCellContent = (column: TableColumn, row: any) => {
    const value = row[column.key]

    if (column.render) {
      return column.render(value, row)
    }

    // Rendu spécialisé par type de données
    if (column.key === 'status') {
      const StatusIcon = getStatusIcon(value)
      return (
        <Badge
          colorScheme={getStatusColor(value)}
          variant="subtle"
          display="flex"
          alignItems="center"
          gap={1}
          w="fit-content"
        >
          <Icon as={StatusIcon} boxSize={3} />
          {value}
        </Badge>
      )
    }

    if (column.key === nameKey && showAvatar) {
      return (
        <HStack>
          <Avatar size="sm" name={row[avatarKey]} bg="gray.200" />
          <VStack align="start" spacing={0}>
            <Text fontWeight="500">{value}</Text>
            {row.description && (
              <Text fontSize="xs" color="gray.500">
                {row.description}
              </Text>
            )}
          </VStack>
        </HStack>
      )
    }

    if (column.key.includes('cost') || column.key.includes('price')) {
      return (
        <Text fontWeight="500" color="green.600">
          ${typeof value === 'number' ? value.toFixed(2) : value}
        </Text>
      )
    }

    if (column.key.includes('id') && typeof value === 'string' && value.length > 10) {
      return (
        <Tooltip label={value}>
          <Text fontFamily="mono" fontSize="sm">
            {value.slice(0, 8)}...
          </Text>
        </Tooltip>
      )
    }

    if (column.key.includes('date') || column.key.includes('time')) {
      return (
        <Text fontSize="sm">
          {typeof value === 'string' ? new Date(value).toLocaleString('fr-FR') : value}
        </Text>
      )
    }

    return <Text>{value}</Text>
  }

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="500" color="black">
          {title}
        </Text>
        <Badge
          colorScheme={level === 'global' ? 'blue' : level === 'franchise' ? 'purple' : 'green'}
          variant="subtle"
          textTransform="uppercase"
          fontSize="xs"
        >
          {level} LEVEL
        </Badge>
      </HStack>
      
      <Box
        bg="white"
        borderRadius="16px"
        shadow="0 4px 20px rgba(0, 0, 0, 0.08)"
        border="1px solid"
        borderColor={levelColors.border}
        overflow="hidden"
      >
        <TableContainer>
          <Table variant="simple">
            <Thead bg={levelColors.header}>
              <Tr>
                {columns.map((column) => (
                  <Th key={column.key} width={column.width}>
                    {column.label}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row, index) => (
                <MotionTr
                  key={row.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  cursor={onRowClick ? "pointer" : "default"}
                  onClick={() => onRowClick?.(row)}
                  _hover={onRowClick ? {
                    bg: levelColors.header,
                    transition: "background-color 0.2s ease"
                  } : {}}
                >
                  {columns.map((column) => (
                    <Td key={column.key}>
                      {renderCellContent(column, row)}
                    </Td>
                  ))}
                </MotionTr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {data.length === 0 && (
        <Box
          p={8}
          textAlign="center"
          bg="gray.50"
          borderRadius="16px"
          border="1px solid"
          borderColor="gray.100"
        >
          <Text color="gray.500" fontSize="sm">
            Aucune donnée disponible pour ce niveau
          </Text>
        </Box>
      )}
    </VStack>
  )
}
/**
 * 📋 DATA TABLE - TABLE PROFESSIONNELLE SENTRY-STYLE
 * Table standardisée avec tri, pagination, actions
 */

'use client'

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Skeleton,
  useColorModeValue,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react'
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState, useMemo } from 'react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  selectable?: boolean
  onRowSelect?: (selectedRows: any[]) => void
  onRowClick?: (row: any) => void
  pageSize?: number
  actions?: Array<{
    label: string
    onClick: (row: any) => void
    icon?: any
    colorScheme?: string
  }>
}

export default function DataTable({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  selectable = false,
  onRowSelect,
  onRowClick,
  pageSize = 10,
  actions = []
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Filtrage et tri
  const processedData = useMemo(() => {
    let filtered = data

    // Recherche
    if (searchTerm) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Tri
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(row => row.id)))
    } else {
      setSelectedRows(new Set())
    }
    onRowSelect?.(checked ? paginatedData : [])
  }

  const handleRowSelect = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(rowId)
    } else {
      newSelected.delete(rowId)
    }
    setSelectedRows(newSelected)
    onRowSelect?.(data.filter(row => newSelected.has(row.id)))
  }

  if (loading) {
    return (
      <Box bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
        <VStack spacing={4} p={4}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} height="40px" width="100%" />
          ))}
        </VStack>
      </Box>
    )
  }

  return (
    <Box bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
      
      {/* Header avec recherche */}
      {searchable && (
        <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
          <HStack spacing={4}>
            <InputGroup size="sm" maxW="300px">
              <InputLeftElement>
                <Search size={14} color="gray" />
              </InputLeftElement>
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Text fontSize="xs" color="gray.500">
              {processedData.length} résultats
            </Text>
          </HStack>
        </Box>
      )}

      {/* Table */}
      <Box overflowX="auto">
        <Table size="sm">
          <Thead>
            <Tr>
              {selectable && (
                <Th width="40px">
                  <Checkbox
                    isChecked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    isIndeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </Th>
              )}
              
              {columns.map(column => (
                <Th 
                  key={column.key}
                  width={column.width}
                  cursor={column.sortable ? 'pointer' : 'default'}
                  onClick={() => column.sortable && handleSort(column.key)}
                  _hover={column.sortable ? { bg: 'gray.50' } : {}}
                >
                  <HStack spacing={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600">
                      {column.label}
                    </Text>
                    {column.sortable && sortColumn === column.key && (
                      <Box>
                        {sortDirection === 'asc' ? 
                          <ChevronUp size={12} /> : 
                          <ChevronDown size={12} />
                        }
                      </Box>
                    )}
                  </HStack>
                </Th>
              ))}
              
              {actions.length > 0 && (
                <Th width="60px"></Th>
              )}
            </Tr>
          </Thead>
          
          <Tbody>
            {paginatedData.map((row, index) => (
              <Tr 
                key={row.id || index}
                cursor={onRowClick ? 'pointer' : 'default'}
                _hover={onRowClick ? { bg: 'gray.50' } : {}}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <Td>
                    <Checkbox
                      isChecked={selectedRows.has(row.id)}
                      onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Td>
                )}
                
                {columns.map(column => (
                  <Td key={column.key}>
                    {column.render ? 
                      column.render(row[column.key], row) : 
                      <Text fontSize="sm">{row[column.key]}</Text>
                    }
                  </Td>
                ))}
                
                {actions.length > 0 && (
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<MoreVertical size={14} />}
                        size="xs"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        {actions.map((action, i) => (
                          <MenuItem 
                            key={i}
                            onClick={() => action.onClick(row)}
                            icon={action.icon && <action.icon size={14} />}
                          >
                            {action.label}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box p={4} borderTop="1px solid" borderColor={borderColor}>
          <HStack justify="space-between" align="center">
            <Text fontSize="xs" color="gray.500">
              Page {currentPage} sur {totalPages}
            </Text>
            
            <HStack spacing={1}>
              <IconButton
                aria-label="Page précédente"
                icon={<ChevronLeft size={14} />}
                size="xs"
                variant="outline"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              />
              
              <IconButton
                aria-label="Page suivante"
                icon={<ChevronRight size={14} />}
                size="xs"
                variant="outline"
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              />
            </HStack>
          </HStack>
        </Box>
      )}

    </Box>
  )
}

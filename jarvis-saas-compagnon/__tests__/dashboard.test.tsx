import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import DashboardPage from '../src/app/dashboard/page'
import { createClient } from '../src/lib/supabase-simple'

// Mock du client Supabase
jest.mock('../src/lib/supabase-simple', () => ({
  createClient: jest.fn()
}))

// Mock des franchises de test
const mockFranchises = [
  {
    id: '1',
    name: 'FitGym Paris',
    address: '123 Rue de Rivoli',
    city: 'Paris',
    postal_code: '75001',
    email: 'paris@fitgym.fr',
    phone: '01.23.45.67.89',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2', 
    name: 'PowerGym Lyon',
    address: '456 Cours Lafayette',
    city: 'Lyon',
    postal_code: '69003',
    email: 'lyon@powergym.fr',
    phone: '04.78.90.12.34',
    is_active: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

// Wrapper pour Chakra UI
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
)

describe('Dashboard Page', () => {
  const mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  test('should render dashboard title', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Vue d\'ensemble de votre plateforme JARVIS')).toBeInTheDocument()
  })

  test('should render stats cards', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )
    
    expect(screen.getByText('Franchises')).toBeInTheDocument()
    expect(screen.getByText('Franchises actives')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
    expect(screen.getByText('Latence API')).toBeInTheDocument()
  })

  test('should render franchise management section', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )
    
    expect(screen.getByText('Gestion des Franchises')).toBeInTheDocument()
    expect(screen.getByText('Gérer et monitorer toutes vos franchises')).toBeInTheDocument()
  })

  test('should show loading spinner initially', () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

describe('Franchise Components', () => {
  test('should handle empty franchise list', () => {
    // Test pour la gestion d'une liste vide de franchises
    expect(true).toBe(true) // Placeholder pour l'instant
  })

  test('should handle franchise click navigation', () => {
    // Test pour la navigation clic sur franchise
    expect(true).toBe(true) // Placeholder pour l'instant
  })

  test('should handle loading states', () => {
    // Test pour les états de chargement
    expect(true).toBe(true) // Placeholder pour l'instant
  })
}) 
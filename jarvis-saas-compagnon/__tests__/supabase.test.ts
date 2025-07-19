// Test unitaire pour vérifier les imports de Supabase
import { describe, test, expect } from '@jest/globals'
import { createClient } from '../src/lib/supabase-simple'
import type { Database } from '../src/types/database'

describe('Supabase Client Tests', () => {
  test('createClient should be a function', () => {
    expect(typeof createClient).toBe('function')
  })

  test('createClient should create a client instance', () => {
    // Mock des variables d'environnement pour les tests
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    
    const client = createClient()
    expect(client).toBeDefined()
  })
})

// Test simple pour les types Database
describe('Database Types', () => {
  test('Database type should be properly exported', () => {
    // Ce test vérifie que le type Database est correctement importé
    const testType: Database['public']['Tables']['franchises']['Row'] = {
      id: 'test-id',
      name: 'Test Franchise',
      address: 'Test Address',
      city: 'Test City',
      postal_code: '12345',
      email: 'test@test.com',
      phone: '1234567890',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    
    expect(testType).toBeDefined()
    expect(testType.name).toBe('Test Franchise')
  })
})

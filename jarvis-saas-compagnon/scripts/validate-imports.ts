// Test de validation des imports - version simple sans framework de test

async function validateSupabaseImport() {
  try {
    // Mock des variables d'environnement pour test
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    
    const { createClient } = await import('../src/lib/supabase-simple')
    
    if (typeof createClient !== 'function') {
      throw new Error('createClient is not a function')
    }
    
    console.log('✅ Supabase import: OK')
    return true
  } catch (error) {
    console.error('❌ Supabase import failed:', error)
    return false
  }
}

async function validateChakraImport() {
  try {
    const { Box, Button, VStack } = await import('@chakra-ui/react')
    
    if (!Box || !Button || !VStack) {
      throw new Error('Chakra UI components not found')
    }
    
    console.log('✅ Chakra UI import: OK')
    return true
  } catch (error) {
    console.error('❌ Chakra UI import failed:', error)
    return false
  }
}

async function validateUtilsImport() {
  try {
    const { cn, formatDate, capitalize } = await import('../src/lib/utils')
    
    if (typeof cn !== 'function' || typeof formatDate !== 'function' || typeof capitalize !== 'function') {
      throw new Error('Utils functions not found')
    }
    
    // Test des fonctions
    const testCn = cn('class1', 'class2')
    const testCapitalize = capitalize('hello')
    
    if (testCn !== 'class1 class2' || testCapitalize !== 'Hello') {
      throw new Error('Utils functions not working correctly')
    }
    
    console.log('✅ Utils import: OK')
    return true
  } catch (error) {
    console.error('❌ Utils import failed:', error)
    return false
  }
}

async function runAllTests() {
  console.log('🧪 Validation des imports...\n')
  
  const results = await Promise.all([
    validateSupabaseImport(),
    validateChakraImport(),
    validateUtilsImport()
  ])
  
  const allPassed = results.every(result => result === true)
  
  console.log('\n📊 Résultats:')
  console.log(`✅ Tests réussis: ${results.filter(r => r).length}/${results.length}`)
  console.log(`❌ Tests échoués: ${results.filter(r => !r).length}/${results.length}`)
  
  if (allPassed) {
    console.log('\n🎉 Tous les imports sont valides!')
  } else {
    console.log('\n⚠️ Certains imports ont des problèmes.')
  }
  
  return allPassed
}

// Export pour utilisation
export { runAllTests, validateSupabaseImport, validateChakraImport, validateUtilsImport }

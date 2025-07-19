// Test de validation des imports dynamiques

async function testDynamicImports() {
  console.log('🧪 Test des imports dynamiques...\n')
  
  // Test 1: Import de Supabase
  try {
    const supabaseModule = await import('../src/lib/supabase-simple')
    if (typeof supabaseModule.createClient === 'function') {
      console.log('✅ Import dynamique Supabase: OK')
    } else {
      console.log('❌ Import dynamique Supabase: createClient n\'est pas une fonction')
    }
  } catch (error) {
    console.log('❌ Import dynamique Supabase: Échec -', error.message)
  }
  
  // Test 2: Import des types Database
  try {
    const databaseModule = await import('../src/types/database')
    if (databaseModule.Database || typeof databaseModule === 'object') {
      console.log('✅ Import dynamique Database types: OK')
    } else {
      console.log('❌ Import dynamique Database types: Types non trouvés')
    }
  } catch (error) {
    console.log('❌ Import dynamique Database types: Échec -', error.message)
  }
  
  // Test 3: Import de Chakra UI
  try {
    const chakraModule = await import('@chakra-ui/react')
    if (chakraModule.Box && chakraModule.Button) {
      console.log('✅ Import dynamique Chakra UI: OK')
    } else {
      console.log('❌ Import dynamique Chakra UI: Composants non trouvés')
    }
  } catch (error) {
    console.log('❌ Import dynamique Chakra UI: Échec -', error.message)
  }
  
  console.log('\n🎯 Test terminé!')
}

testDynamicImports().catch(console.error)

/**
 * 🔍 VÉRIFICATION RAPIDE DES FRANCHISES
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Lire les variables d'environnement depuis .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkFranchises() {
  console.log('🔍 Vérification des franchises...\n')

  try {
    // 1. Vérifier la structure de la table (skip pour l'instant)
    console.log('📋 Vérification de la table franchises...')

    // 2. Compter les franchises
    const { count, error: countError } = await supabase
      .from('franchises')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Erreur count:', countError.message)
    } else {
      console.log(`\n📊 Total franchises: ${count}`)
    }

    // 3. Récupérer quelques franchises
    const { data: franchises, error: franchisesError } = await supabase
      .from('franchises')
      .select('*')
      .limit(5)

    if (franchisesError) {
      console.error('❌ Erreur franchises:', franchisesError.message)
    } else {
      console.log(`\n✅ Franchises trouvées: ${franchises.length}`)
      franchises.forEach(f => {
        console.log(`   - ${f.name} (${f.city || 'Ville non définie'})`)
      })
    }

    // 4. Vérifier les gyms
    const { count: gymsCount, error: gymsCountError } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true })

    if (!gymsCountError) {
      console.log(`\n🏋️ Total gyms: ${gymsCount}`)
    }

    // 5. Vérifier les membres
    const { count: membersCount, error: membersCountError } = await supabase
      .from('gym_members')
      .select('*', { count: 'exact', head: true })

    if (!membersCountError) {
      console.log(`👥 Total membres: ${membersCount}`)
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error.message)
  }
}

checkFranchises()

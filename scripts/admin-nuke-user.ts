
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Env vars missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function nukeUser(email: string) {
  console.log(`☢️  NUKING USER: ${email}`)
  
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users?.find(u => u.email === email)

  if (user) {
    console.log(`✅ User found: ${user.id}`)
    await supabase.auth.admin.deleteUser(user.id)
    console.log('✅ Auth User DELETED')
  } else {
    console.log('⚠️ Auth User not found')
  }

  await supabase.from('users').delete().eq('email', email)
  console.log('✅ Public User cleaned')

  await supabase.from('manager_invitations')
    .update({ status: 'pending', expires_at: new Date(Date.now() + 86400000 * 7).toISOString() })
    .eq('email', email)
  console.log('✅ Invitation reset')
}

nukeUser('brice.pradet@gmail.com')


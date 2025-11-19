const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Env vars missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function repairOrphanedUsers() {
  console.log('🔍 [REPAIR] Scanning for orphaned Auth users...\n');

  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Failed to list Auth users:', authError);
    return;
  }

  console.log(`✅ Found ${authUsers.length} Auth users\n`);

  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('id, email, role');

  if (publicError) {
    console.error('❌ Failed to list Public users:', publicError);
    return;
  }

  const publicUserIds = new Set(publicUsers.map(u => u.id));
  console.log(`✅ Found ${publicUsers.length} Public users\n`);

  const orphans = authUsers.filter(authUser => !publicUserIds.has(authUser.id));

  if (orphans.length === 0) {
    console.log('✅ No orphans found.');
    return;
  }

  console.log(`⚠️  Found ${orphans.length} ORPHANED users:\n`);

  for (const orphan of orphans) {
    console.log(`📧 ${orphan.email} (ID: ${orphan.id})`);

    const role = orphan.user_metadata?.role || 'gym_manager';
    const fullName = orphan.user_metadata?.full_name || orphan.email.split('@')[0];
    const gymId = orphan.user_metadata?.gym_id || null;

    console.log(`   🔧 Creating Public profile...`);

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: orphan.id,
        email: orphan.email,
        full_name: fullName,
        role: role,
        gym_id: gymId,
        is_active: true,
      });

    if (insertError) {
      console.log(`   ❌ Create failed: ${insertError.message}`);
      console.log(`   🗑️  Deleting Auth user...`);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(orphan.id);
      if (deleteError) {
        console.log(`   ❌ Delete failed: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Auth user DELETED`);
      }
    } else {
      console.log(`   ✅ Public profile CREATED`);
    }

    console.log('');
  }

  console.log('🏁 COMPLETE.');
}

repairOrphanedUsers();


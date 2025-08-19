import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function GET() {
  try {
    const supabase = getSupabaseService()
    
    console.log('🔍 [DB AUDIT] Démarrage audit complet Supabase...')
    
    // 1. AUDIT DES TABLES ET SCHÉMAS
    const tablesQuery = `
      SELECT 
        schemaname,
        tablename,
        tableowner,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE schemaname IN ('public', 'auth')
      ORDER BY schemaname, tablename;
    `
    
    const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
      sql: tablesQuery
    }).single()
    
    if (tablesError) {
      // Fallback: Lister les tables via information_schema
      const { data: tablesList } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name, table_type')
        .in('table_schema', ['public'])
    }

    // 2. AUDIT DES COLONNES POUR CHAQUE TABLE
    const columnsAudit = {}
    const publicTables = [
      'franchises', 'gyms', 'kiosk_configs', 'gym_members', 
      'jarvis_conversation_logs', 'member_knowledge_base', 'member_session_analytics',
      'openai_realtime_sessions', 'openai_realtime_audio_events', 'jarvis_session_costs',
      'onboarding_progress', 'manager_actions', 'manager_notifications',
      'profiles', 'user_roles', 'team_members'
    ]

    for (const tableName of publicTables) {
      try {
        // Obtenir la structure de la table
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select(`
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision
          `)
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position')

        if (columns && columns.length > 0) {
          columnsAudit[tableName] = columns
        }
      } catch (err) {
        console.warn(`⚠️ Table ${tableName} non accessible:`, err)
      }
    }

    // 3. AUDIT DES DONNÉES EXISTANTES
    const dataAudit = {}
    
    for (const tableName of Object.keys(columnsAudit)) {
      try {
        // Compter les enregistrements
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        // Échantillon des données (3 premiers)
        const { data: sample } = await supabase
          .from(tableName)
          .select('*')
          .limit(3)
        
        dataAudit[tableName] = {
          count: count || 0,
          sample: sample || [],
          hasData: (count || 0) > 0
        }
      } catch (err) {
        console.warn(`⚠️ Données table ${tableName} non accessibles:`, err)
        dataAudit[tableName] = { count: 0, sample: [], hasData: false, error: err.message }
      }
    }

    // 4. AUDIT DES RELATIONS ET CONTRAINTES
    const relationsQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `

    // 5. AUDIT DES INDEX
    const indexQuery = `
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        array_to_string(array_agg(a.attname), ', ') as column_names
      FROM pg_class t,
           pg_class i,
           pg_index ix,
           pg_attribute a,
           pg_namespace n
      WHERE t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND n.oid = t.relnamespace
        AND n.nspname = 'public'
      GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
      ORDER BY t.relname, i.relname;
    `

    // 6. AUDIT RLS (Row Level Security)
    const rlsQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `

    // 7. AUDIT DES FONCTIONS/RPC
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_type,
        data_type as return_type,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `

    console.log('✅ [DB AUDIT] Audit terminé avec succès')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      audit: {
        schema: {
          tables: Object.keys(columnsAudit),
          totalTables: Object.keys(columnsAudit).length,
          columns: columnsAudit
        },
        data: dataAudit,
        summary: {
          tablesWithData: Object.entries(dataAudit).filter(([_, info]) => info.hasData).length,
          totalRecords: Object.values(dataAudit).reduce((sum, info) => sum + (info.count || 0), 0),
          emptyTables: Object.entries(dataAudit).filter(([_, info]) => !info.hasData).map(([name]) => name)
        }
      }
    })

  } catch (error) {
    console.error('❌ [DB AUDIT] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

/**
 * 🔍 DEBUG: Vérifier les variables d'environnement sur Vercel
 */
export async function GET() {
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    }

    console.log('🔍 [ENV DEBUG] Variables environnement:', envVars)

    return NextResponse.json({
      success: true,
      env_status: envVars,
      supabase_service_available: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ [ENV DEBUG] Erreur:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

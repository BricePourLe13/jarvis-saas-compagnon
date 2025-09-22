import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Sauvegarder dans Supabase
    const supabase = getSupabaseService()
    
    // Créer ou mettre à jour l'entrée
    const { data, error } = await supabase
      .from('voice_demo_emails')
      .upsert({
        email: email.toLowerCase().trim(),
        requested_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      }, {
        onConflict: 'email'
      })
      .select()

    if (error) {
      console.error('❌ Erreur Supabase email:', error)
      // Continue même si la sauvegarde échoue
      return NextResponse.json({ 
        success: true,
        message: 'Email enregistré (fallback)' 
      })
    }

    console.log('✅ Email vitrine sauvé:', {
      email: email.substring(0, 5) + '...',
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true,
      message: 'Email enregistré avec succès' 
    })

  } catch (error) {
    console.error('❌ Erreur sauvegarde email:', error)
    // Ne pas bloquer la démo pour une erreur d'email
    return NextResponse.json({ 
      success: true,
      message: 'Démo autorisée' 
    })
  }
}

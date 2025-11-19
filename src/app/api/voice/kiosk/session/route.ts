/**
 * API Route : Créer une session Realtime pour JARVIS Kiosk (Miroir + Mobile)
 * 
 * POST /api/voice/kiosk/session
 * 
 * Body: { memberId: string, gymId: string }
 * 
 * - Génère un ephemeral token OpenAI
 * - Charge contexte membre (nom, objectifs, stats)
 * - Configure tools (réservations, profil, etc.)
 * - Auth requise (badge RFID ou login mobile)
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealtimeSessionFactory } from '@/lib/voice/core/realtime-session-factory';
import { KIOSK_CONFIG, getKioskSessionConfig } from '@/lib/voice/contexts/kiosk-config';
import { getSupabaseService } from '@/lib/supabase-service';
import { getOpenAIFunctionsForGym } from '@/lib/custom-tools/helpers';
import { logger } from '@/lib/production-logger';

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const { memberId, gymId } = body;

    if (!memberId || !gymId) {
      return NextResponse.json(
        { error: 'memberId et gymId requis' },
        { status: 400 }
      );
    }

    // ============================================
    // 2. CHARGER CONTEXTE MEMBRE
    // ============================================
    const supabase = getSupabaseService();
    
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        membership_type,
        fitness_goals,
        last_visit_date,
        created_at
      `)
      .eq('id', memberId)
      .eq('gym_id', gymId)
      .single();

    if (memberError || !member) {
      logger.error('❌ [KIOSK] Membre introuvable:', memberError);
      return NextResponse.json(
        { error: 'Membre introuvable', details: memberError?.message },
        { status: 404 }
      );
    }

    // ============================================
    // 3. CHARGER INFO GYM
    // ============================================
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, address')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      logger.error('❌ [KIOSK] Gym introuvable:', gymError);
      return NextResponse.json(
        { error: 'Gym introuvable', details: gymError?.message },
        { status: 404 }
      );
    }

    // ============================================
    // 4. CRÉER EPHEMERAL TOKEN (GA)
    // ============================================
    const factory = new RealtimeSessionFactory();
    
    const sessionResult = await factory.createSession({
      model: KIOSK_CONFIG.model,
      voice: KIOSK_CONFIG.voice,
      sessionId: `kiosk_${gymId}_${memberId}_${Date.now()}`
    });

    if (!sessionResult.success || !sessionResult.session) {
      logger.error('❌ [KIOSK] Failed to create session:', sessionResult.error);
      return NextResponse.json(
        { error: 'Échec création session OpenAI', details: sessionResult.error },
        { status: 500 }
      );
    }

    // ============================================
    // 5. PRÉPARER CONFIG SESSION.UPDATE
    // ============================================
    const memberContext = {
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      firstName: member.first_name,
      membershipType: member.membership_type || 'Standard',
      lastVisit: member.last_visit_date 
        ? new Date(member.last_visit_date).toLocaleDateString('fr-FR')
        : undefined,
      goals: member.fitness_goals || []
    };

    const sessionUpdateConfig = getKioskSessionConfig(memberContext);
    
    // 🔧 CHARGER CUSTOM TOOLS DE LA GYM
    const customTools = await getOpenAIFunctionsForGym(gymId);
    
    // Fusionner tools built-in + custom tools
    if (customTools.length > 0) {
      logger.info(`✨ [KIOSK] ${customTools.length} custom tools chargés pour gym ${gym.name}`);
      sessionUpdateConfig.tools = [
        ...sessionUpdateConfig.tools,
        ...customTools
      ];
    }

    // ============================================
    // 6. LOG SESSION START (Analytics)
    // ============================================
    await supabase.from('conversations').insert({
      member_id: memberId,
      gym_id: gymId,
      session_id: sessionResult.session.session_id,
      started_at: new Date().toISOString(),
      status: 'active'
    });

    // ============================================
    // 7. RESPONSE
    // ============================================
    logger.info('✅ [KIOSK] Session créée:', {
      sessionId: sessionResult.session.session_id,
      memberId,
      memberName: memberContext.name,
      gymId,
      gymName: gym.name
    });

    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionResult.session.session_id,
        client_secret: sessionResult.session.client_secret,
        model: sessionResult.session.model,
        voice: sessionResult.session.voice,
        expires_at: sessionResult.session.expires_at
      },
      sessionUpdateConfig, // Config à envoyer via session.update côté client
      member: {
        id: member.id,
        name: memberContext.name,
        firstName: member.first_name,
        membershipType: memberContext.membershipType
      },
      gym: {
        id: gym.id,
        name: gym.name
      }
    });

  } catch (error) {
    logger.error('❌ [KIOSK] Erreur globale:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}




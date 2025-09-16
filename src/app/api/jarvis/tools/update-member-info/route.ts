/**
 * 🔄 JARVIS TOOL: update_member_info
 * Mise à jour informations membre en temps réel
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { 
      update_type, 
      field_name, 
      new_value, 
      context 
    } = await request.json()

    // 📝 RÉCUPÉRER CONTEXTE MEMBRE DEPUIS LA SESSION
    const memberContext = (global as any).currentMemberContext
    if (!memberContext?.member_id) {
      return NextResponse.json(
        { error: 'Contexte membre non disponible. Outil appelé hors session.' },
        { status: 400 }
      )
    }

    const member_id = memberContext.member_id
    console.log(`🔄 [TOOL] update_member_info pour membre: ${member_id}, type: ${update_type}`)

    if (!update_type || !field_name || !new_value) {
      return NextResponse.json(
        { error: 'Paramètres requis: update_type, field_name, new_value' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // 🔍 VÉRIFIER EXISTENCE MEMBRE
    const { data: member, error: memberError } = await supabase
      .from('gym_members')
      .select('id, first_name, last_name, member_preferences, member_notes')
      .eq('id', member_id)
      .eq('is_active', true)
      .single()

    if (memberError || !member) {
      console.error(`❌ [TOOL] Membre non trouvé: ${member_id}`, memberError)
      return NextResponse.json(
        { error: 'Membre non trouvé ou inactif' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let updateDescription = ''

    // 🎯 TRAITEMENT SELON TYPE DE MISE À JOUR
    switch (update_type) {
      case 'fitness_progress':
        // Mise à jour progrès fitness (poids, mesures, etc.)
        const currentPrefs = member.member_preferences || {}
        
        if (field_name === 'current_weight') {
          if (!currentPrefs.fitness_profile) {
            currentPrefs.fitness_profile = {}
          }
          currentPrefs.fitness_profile.current_weight = new_value
          currentPrefs.fitness_profile.weight_updated_at = new Date().toISOString()
          updateDescription = `Poids mis à jour: ${new_value}`
        } else if (field_name === 'fitness_level') {
          currentPrefs.fitness_profile = currentPrefs.fitness_profile || {}
          currentPrefs.fitness_profile.current_level = new_value
          updateDescription = `Niveau fitness mis à jour: ${new_value}`
        }
        
        updateData.member_preferences = currentPrefs
        break

      case 'goals':
        // Mise à jour objectifs
        const goalsPrefs = member.member_preferences || {}
        
        if (field_name === 'add_goal') {
          if (!goalsPrefs.current_goals) {
            goalsPrefs.current_goals = []
          }
          
          try {
            const newGoal = JSON.parse(new_value)
            goalsPrefs.current_goals.push({
              ...newGoal,
              added_at: new Date().toISOString(),
              added_via: 'jarvis_conversation'
            })
            updateDescription = `Nouvel objectif ajouté: ${newGoal.type || new_value}`
          } catch {
            // Si ce n'est pas du JSON, traiter comme texte simple
            goalsPrefs.current_goals.push({
              type: 'custom',
              description: new_value,
              added_at: new Date().toISOString(),
              added_via: 'jarvis_conversation'
            })
            updateDescription = `Nouvel objectif ajouté: ${new_value}`
          }
        }
        
        updateData.member_preferences = goalsPrefs
        break

      case 'preferences':
        // Mise à jour préférences communication/entraînement
        const prefPrefs = member.member_preferences || {}
        
        if (field_name === 'communication_style') {
          if (!prefPrefs.communication_preferences) {
            prefPrefs.communication_preferences = {}
          }
          prefPrefs.communication_preferences.style = new_value
          updateDescription = `Style communication mis à jour: ${new_value}`
        } else if (field_name === 'preferred_activities') {
          prefPrefs.favorite_activities = Array.isArray(new_value) ? new_value : [new_value]
          updateDescription = `Activités préférées mises à jour`
        }
        
        updateData.member_preferences = prefPrefs
        break

      case 'personal_notes':
        // Ajout de notes personnelles
        const currentNotes = member.member_notes || ''
        const timestamp = new Date().toISOString()
        const newNote = `[${timestamp}] ${context ? `(${context}) ` : ''}${new_value}`
        
        updateData.member_notes = currentNotes 
          ? `${currentNotes}\n${newNote}`
          : newNote
        
        updateDescription = `Note personnelle ajoutée: ${new_value.substring(0, 50)}...`
        break

      default:
        return NextResponse.json(
          { error: `Type de mise à jour non supporté: ${update_type}` },
          { status: 400 }
        )
    }

    // 📝 MISE À JOUR EN BASE
    updateData.updated_at = new Date().toISOString()
    
    console.log(`🔄 [TOOL] Données à mettre à jour:`, JSON.stringify(updateData, null, 2))
    
    const { error: updateError } = await supabase
      .from('gym_members')
      .update(updateData)
      .eq('id', member_id)
    
    console.log(`🔄 [TOOL] Résultat mise à jour - Erreur:`, updateError)

    if (updateError) {
      console.error(`❌ [TOOL] Erreur mise à jour membre:`, updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    // 📊 LOG DE L'ACTION
    const logData = {
      member_id,
      action_type: 'profile_update',
      action_details: {
        update_type,
        field_name,
        new_value,
        context,
        description: updateDescription
      },
      timestamp: new Date().toISOString(),
      source: 'jarvis_tool'
    }

    // Optionnel: Enregistrer dans une table d'audit si elle existe
    try {
      await supabase
        .from('member_action_logs')
        .insert(logData)
    } catch (logError) {
      // Pas critique si la table n'existe pas encore
      console.log('ℹ️ [TOOL] Table member_action_logs non disponible')
    }

    console.log(`✅ [TOOL] Profil mis à jour pour ${member.first_name} ${member.last_name}: ${updateDescription}`)

    return NextResponse.json({
      success: true,
      update_applied: {
        member_id,
        update_type,
        field_name,
        description: updateDescription,
        updated_at: updateData.updated_at
      },
      message: `Profil de ${member.first_name} mis à jour avec succès`
    })

  } catch (error: any) {
    console.error('🚨 [TOOL] Erreur update_member_info:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

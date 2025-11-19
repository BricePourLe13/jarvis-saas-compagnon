/**
 * Tool: get_class_schedule
 * 
 * Récupère les horaires des cours pour une gym spécifique
 */

import { logger } from '@/lib/production-logger';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation des inputs
const requestSchema = z.object({
  sessionId: z.string(),
  gymId: z.string().uuid(),
  className: z.string().optional(),
  date: z.string().optional(), // Format: YYYY-MM-DD
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Parse et valide le body
    const body = await request.json()
    const { sessionId, gymId, className, date, dayOfWeek } = requestSchema.parse(body)
    
    logger.info(`🔧 [TOOL] get_class_schedule appelé pour gym ${gymId}`)
    
    // Déterminer la date à query
    const queryDate = date || new Date().toISOString().split('T')[0]
    
    // Query les cours
    let query = supabase
      .from('gym_classes')
      .select(`
        id,
        name,
        instructor_name,
        start_time,
        end_time,
        capacity,
        duration_minutes,
        description,
        difficulty_level,
        day_of_week,
        date
      `)
      .eq('gym_id', gymId)
      .eq('is_active', true)
    
    // Filtres optionnels
    if (className) {
      query = query.ilike('name', `%${className}%`)
    }
    
    if (dayOfWeek) {
      query = query.eq('day_of_week', dayOfWeek)
    } else {
      // Si pas de jour spécifié, chercher par date
      query = query.eq('date', queryDate)
    }
    
    query = query.order('start_time', { ascending: true })
    
    const { data: classes, error } = await query
    
    if (error) {
      logger.error('❌ [TOOL] Erreur DB:', error)
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération horaires',
        message: 'Désolé, je ne peux pas récupérer les horaires pour le moment.'
      }, { status: 500 })
    }
    
    // Si aucun cours trouvé
    if (!classes || classes.length === 0) {
      const notFoundMessage = className
        ? `Aucun cours de "${className}" trouvé pour ${queryDate}.`
        : `Aucun cours programmé pour ${queryDate}.`
      
      return NextResponse.json({
        success: true,
        classes: [],
        message: notFoundMessage,
        suggestions: [
          "Tu peux me demander les horaires pour un autre jour",
          "Ou demander un cours spécifique comme 'yoga' ou 'spinning'"
        ]
      })
    }
    
    // Compter places disponibles
    const classesWithAvailability = await Promise.all(
      classes.map(async (cls) => {
        const { count: reservedCount } = await supabase
          .from('class_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('status', 'confirmed')
        
        const availableSpots = cls.capacity - (reservedCount || 0)
        
        return {
          ...cls,
          reserved_spots: reservedCount || 0,
          available_spots: availableSpots,
          is_full: availableSpots <= 0
        }
      })
    )
    
    // Construire le message de réponse
    const classesCount = classesWithAvailability.length
    let responseMessage = `J'ai trouvé ${classesCount} cours`
    
    if (className) {
      responseMessage += ` de ${className}`
    }
    
    if (dayOfWeek) {
      const dayNames: Record<string, string> = {
        monday: 'lundi',
        tuesday: 'mardi',
        wednesday: 'mercredi',
        thursday: 'jeudi',
        friday: 'vendredi',
        saturday: 'samedi',
        sunday: 'dimanche'
      }
      responseMessage += ` le ${dayNames[dayOfWeek]}`
    } else {
      responseMessage += ` pour le ${new Date(queryDate).toLocaleDateString('fr-FR')}`
    }
    
    responseMessage += '. Voici les horaires :\n\n'
    
    classesWithAvailability.forEach((cls, index) => {
      const availableText = cls.is_full ? '(COMPLET)' : `(${cls.available_spots} places dispo)`
      responseMessage += `${index + 1}. ${cls.name} - ${cls.start_time} à ${cls.end_time} avec ${cls.instructor_name} ${availableText}\n`
    })
    
    // Log de l'interaction
    await supabase
      .from('jarvis_conversation_logs')
      .insert({
        session_id: sessionId,
        gym_id: gymId,
        speaker: 'system',
        message_text: `[TOOL] get_class_schedule: ${classesCount} cours trouvés`,
        detected_intent: 'get_class_schedule',
        topic_category: 'class_schedule',
        timestamp: new Date().toISOString(),
        metadata: {
          tool_name: 'get_class_schedule',
          classes_count: classesCount,
          query_date: queryDate,
          class_name: className
        }
      })
    
    logger.info(`✅ [TOOL] get_class_schedule: ${classesCount} cours trouvés`)
    
    return NextResponse.json({
      success: true,
      classes: classesWithAvailability,
      message: responseMessage,
      metadata: {
        total_classes: classesCount,
        query_date: queryDate,
        has_full_classes: classesWithAvailability.some(c => c.is_full)
      }
    })
    
  } catch (error) {
    logger.error('❌ [TOOL] get_class_schedule error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Désolé, une erreur est survenue.'
    }, { status: 500 })
  }
}

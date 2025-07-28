/**
 * 🧪 Utilitaire de test pour le système de tracking de session
 * Permet de créer des sessions de test pour vérifier les métriques
 */

import { trackSessionCost } from './openai-cost-tracker'

/**
 * Créer une session de test pour Martin
 */
export async function createTestSession(gymId: string, franchiseId?: string) {
  console.log('🧪 [TEST] Création d\'une session de test...')
  
  try {
    const testSession = await trackSessionCost({
      sessionId: `test_martin_${Date.now()}`,
      gymId,
      franchiseId,
      timestamp: new Date(),
      durationSeconds: 120, // 2 minutes
      textInputTokens: 50,
      textOutputTokens: 150,
      audioInputTokens: 3334, // ~2 minutes d'audio input
      audioOutputTokens: 1667, // ~1 minute d'audio output
      userSatisfaction: 4.5,
      errorOccurred: false,
      endReason: 'user_ended',
      audioInputSeconds: 120,
      audioOutputSeconds: 60
    })
    
    console.log('🧪 [TEST] Session de test créée:', testSession.sessionId)
    console.log('🧪 [TEST] Coût total:', `$${testSession.totalCost.toFixed(4)}`)
    
    return testSession
  } catch (error) {
    console.error('🧪 [TEST] Erreur création session test:', error)
    throw error
  }
}

/**
 * Créer plusieurs sessions de test pour simuler l'activité
 */
export async function createMultipleTestSessions(gymId: string, franchiseId?: string, count: number = 3) {
  console.log(`🧪 [TEST] Création de ${count} sessions de test...`)
  
  const sessions = []
  
  for (let i = 0; i < count; i++) {
    // Varier les données pour plus de réalisme
    const durationVariation = Math.random() * 60 + 60 // 1-2 minutes
    const satisfactionVariation = Math.random() * 2 + 3 // 3-5 étoiles
    
    try {
      const session = await trackSessionCost({
        sessionId: `test_batch_${Date.now()}_${i}`,
        gymId,
        franchiseId,
        timestamp: new Date(Date.now() - (i * 10 * 60 * 1000)), // Étalé sur les 30 dernières minutes
        durationSeconds: Math.floor(durationVariation),
        textInputTokens: Math.floor(Math.random() * 100 + 20),
        textOutputTokens: Math.floor(Math.random() * 200 + 100),
        audioInputTokens: Math.floor(durationVariation * 1667 / 60),
        audioOutputTokens: Math.floor(durationVariation * 1667 / 120),
        userSatisfaction: Math.round(satisfactionVariation * 10) / 10,
        errorOccurred: Math.random() < 0.1, // 10% de chance d'erreur
        endReason: Math.random() < 0.9 ? 'user_ended' : 'error',
        audioInputSeconds: durationVariation,
        audioOutputSeconds: durationVariation / 2
      })
      
      sessions.push(session)
      console.log(`🧪 [TEST] Session ${i + 1}/${count} créée: ${session.sessionId}`)
    } catch (error) {
      console.error(`🧪 [TEST] Erreur session ${i + 1}:`, error)
    }
  }
  
  console.log(`🧪 [TEST] ${sessions.length}/${count} sessions créées avec succès`)
  return sessions
} 
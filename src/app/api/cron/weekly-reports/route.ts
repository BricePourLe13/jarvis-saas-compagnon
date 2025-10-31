import { NextRequest, NextResponse } from 'next/server'
import { createSimpleClient } from '@/lib/supabase-admin'

/**
 * CRON JOB HEBDOMADAIRE - Rapports Automatiques
 * 
 * Exécuté tous les lundis à 6h00 AM
 * 
 * - Génère un rapport hebdomadaire pour chaque gym
 * - Analyse KPIs (conversations, sentiment, churn, etc.)
 * - Stocke dans insights_reports
 * - (Optionnel) Envoie email au gérant via Resend
 * 
 * Configuration Upstash QStash:
 * - URL: https://jarvis-group.net/api/cron/weekly-reports
 * - Schedule: 0 6 * * 1 (tous les lundis à 6h00 AM)
 * - Method: POST
 */

export async function POST(request: NextRequest) {
  try {
    // Vérifier la signature Upstash (sécurité)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting weekly reports generation')

    const supabase = createSimpleClient()
    
    // Dates période (7 derniers jours)
    const periodEnd = new Date()
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - 7)

    // 1. Récupérer toutes les gyms actives
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id, name, franchise_id')
      .eq('status', 'active')

    if (gymsError) {
      throw new Error(`Failed to fetch gyms: ${gymsError.message}`)
    }

    if (!gyms || gyms.length === 0) {
      console.log('[CRON] No active gyms found')
      return NextResponse.json({
        success: true,
        message: 'No gyms to generate reports for'
      })
    }

    console.log(`[CRON] Generating reports for ${gyms.length} gyms`)

    const results = {
      total: gyms.length,
      generated: 0,
      errors: 0
    }

    // 2. Générer rapport pour chaque gym
    for (const gym of gyms) {
      try {
        // 2.1. Récupérer conversations de la semaine
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversation_summaries')
          .select('*')
          .eq('gym_id', gym.id)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString())

        if (conversationsError) {
          throw conversationsError
        }

        const totalConversations = conversations?.length || 0

        // Si pas de conversations, skip
        if (totalConversations === 0) {
          console.log(`[CRON] No conversations for gym ${gym.name}, skipping`)
          continue
        }

        // 2.2. Calculer KPIs
        const avgSentiment = conversations!.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / totalConversations
        
        const sentimentDistribution = {
          positive: conversations!.filter(c => c.sentiment === 'positive').length,
          neutral: conversations!.filter(c => c.sentiment === 'neutral').length,
          negative: conversations!.filter(c => c.sentiment === 'negative').length,
          mixed: conversations!.filter(c => c.sentiment === 'mixed').length
        }

        // 2.3. Top topics
        const topicsCount: Record<string, number> = {}
        conversations!.forEach(c => {
          (c.key_topics || []).forEach((topic: string) => {
            topicsCount[topic] = (topicsCount[topic] || 0) + 1
          })
        })
        const topTopics = Object.entries(topicsCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([topic, count]) => ({ topic, count }))

        // 2.4. Membres à risque de churn
        const { data: membersAtRisk, error: membersError } = await supabase
          .from('member_analytics')
          .select(`
            member_id,
            churn_risk_score,
            churn_risk_level,
            gym_members_v2!inner(first_name, last_name, gym_id)
          `)
          .eq('gym_members_v2.gym_id', gym.id)
          .in('churn_risk_level', ['high', 'critical'])
          .order('churn_risk_score', { ascending: false })
          .limit(10)

        const churnRiskCount = membersAtRisk?.length || 0

        // 2.5. Membres actifs
        const { data: activeMembers, error: activeMembersError } = await supabase
          .from('gym_members_v2')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', gym.id)
          .eq('is_active', true)

        const totalActiveMembers = activeMembers?.length || 0

        // 2.6. Générer insights et recommandations
        const insights = []
        const recommendations = []

        // Insight 1: Sentiment général
        if (avgSentiment > 0.3) {
          insights.push({
            type: 'positive',
            title: 'Excellent moral des adhérents',
            description: `Le sentiment moyen est très positif (${(avgSentiment * 100).toFixed(0)}%). Les adhérents semblent satisfaits.`
          })
          recommendations.push({
            priority: 'low',
            action: 'Capitaliser sur cette satisfaction en demandant des témoignages ou avis Google.'
          })
        } else if (avgSentiment < -0.1) {
          insights.push({
            type: 'negative',
            title: 'Attention : sentiment en baisse',
            description: `Le sentiment moyen est négatif (${(avgSentiment * 100).toFixed(0)}%). Des adhérents expriment des frustrations.`
          })
          recommendations.push({
            priority: 'high',
            action: 'Investiguer les causes : équipements, accueil, propreté, etc. Organiser un sondage.'
          })
        }

        // Insight 2: Churn risk
        if (churnRiskCount > 0) {
          const churnPercentage = (churnRiskCount / totalActiveMembers) * 100
          insights.push({
            type: 'warning',
            title: `${churnRiskCount} membre(s) à risque de désabonnement`,
            description: `${churnPercentage.toFixed(1)}% des membres actifs présentent un risque élevé de churn.`
          })
          recommendations.push({
            priority: 'urgent',
            action: `Contacter en priorité les ${Math.min(churnRiskCount, 5)} membres les plus à risque cette semaine.`
          })
        }

        // Insight 3: Topics populaires
        if (topTopics.length > 0) {
          insights.push({
            type: 'info',
            title: 'Sujets les plus abordés',
            description: `Top 3 : ${topTopics.slice(0, 3).map(t => t.topic).join(', ')}.`
          })
        }

        // 2.7. Insérer rapport dans insights_reports
        const { error: insertError } = await supabase
          .from('insights_reports')
          .insert({
            gym_id: gym.id,
            report_type: 'weekly_digest',
            title: `Rapport Hebdomadaire - Semaine du ${periodStart.toLocaleDateString('fr-FR')}`,
            summary: `${totalConversations} conversations analysées. Sentiment moyen: ${(avgSentiment * 100).toFixed(0)}%. ${churnRiskCount} membre(s) à risque.`,
            insights: {
              sentiment_avg: avgSentiment,
              sentiment_distribution: sentimentDistribution,
              top_topics: topTopics,
              churn_risk_count: churnRiskCount,
              insights_list: insights
            },
            metrics: {
              total_conversations: totalConversations,
              total_active_members: totalActiveMembers,
              churn_risk_members: churnRiskCount,
              avg_sentiment: avgSentiment
            },
            recommendations: recommendations,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            generated_at: new Date().toISOString()
          })

        if (insertError) {
          throw insertError
        }

        results.generated++
        console.log(`[CRON] Report generated for gym ${gym.name}`)

        // TODO Phase 4 : Envoyer email au gérant via Resend
        // const managerEmail = await getGymManagerEmail(gym.id)
        // await sendWeeklyReportEmail(managerEmail, reportData)

      } catch (error) {
        console.error(`[CRON] Error generating report for gym ${gym.id}:`, error)
        results.errors++
      }

      // Petit délai entre les gyms
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 3. Log système
    await supabase
      .from('system_logs')
      .insert({
        log_type: 'cron_weekly_reports',
        message: `Rapports hebdomadaires générés`,
        details: results
      })

    console.log('[CRON] Weekly reports generation completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Weekly reports generation completed',
      results
    })

  } catch (error) {
    console.error('[CRON] Error in weekly reports generation:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Bloquer les autres méthodes HTTP
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed - Use POST only' },
    { status: 405 }
  )
}



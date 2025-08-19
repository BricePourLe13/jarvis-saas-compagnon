/**
 * 🏋️ GYM SERVICE - Architecture propre
 * Gestion complète des salles avec Prisma
 */

import { prisma } from '../prisma'
import { Gym, Membership, KioskConfig } from '../../../generated/prisma'

export class GymService {
  
  /**
   * 🔍 Récupérer salle par slug
   */
  static async getGymBySlug(slug: string): Promise<Gym | null> {
    return await prisma.gym.findUnique({
      where: { slug },
      include: {
        franchise: { select: { id: true, name: true, slug: true } },
        manager: { select: { id: true, name: true, email: true } },
        kiosk_config: true,
        _count: { 
          select: { 
            memberships: true, 
            jarvis_sessions: true 
          } 
        }
      }
    })
  }

  /**
   * 🏋️ Salles gérées par un manager
   */
  static async getGymsByManager(managerId: string): Promise<Gym[]> {
    return await prisma.gym.findMany({
      where: { manager_id: managerId },
      include: {
        franchise: { select: { id: true, name: true } },
        _count: { 
          select: { 
            memberships: true, 
            jarvis_sessions: { where: { status: 'ACTIVE' } }
          } 
        }
      }
    })
  }

  /**
   * 👥 Membres d'une salle
   */
  static async getGymMembers(gymId: string) {
    return await prisma.membership.findMany({
      where: { 
        gym_id: gymId,
        status: 'ACTIVE'
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true } }
      },
      orderBy: { created_at: 'desc' }
    })
  }

  /**
   * ⚙️ Configuration kiosk
   */
  static async getKioskConfig(gymId: string): Promise<KioskConfig | null> {
    return await prisma.kioskConfig.findUnique({
      where: { gym_id: gymId }
    })
  }

  /**
   * ⚙️ Mettre à jour configuration kiosk
   */
  static async updateKioskConfig(gymId: string, config: Partial<KioskConfig>) {
    return await prisma.kioskConfig.upsert({
      where: { gym_id: gymId },
      create: {
        gym_id: gymId,
        ...config
      },
      update: {
        ...config,
        config_version: { increment: 1 },
        updated_at: new Date()
      }
    })
  }

  /**
   * 📊 Stats temps réel salle
   */
  static async getGymRealtimeStats(gymId: string) {
    const [
      activeSessions,
      todayMetrics,
      totalMembers,
      thisWeekSessions
    ] = await Promise.all([
      // Sessions actives maintenant
      prisma.jarvisSession.count({
        where: { 
          gym_id: gymId, 
          status: 'ACTIVE' 
        }
      }),

      // Métriques du jour
      prisma.dailyMetrics.findUnique({
        where: {
          gym_id_date: {
            gym_id: gymId,
            date: new Date()
          }
        }
      }),

      // Total membres actifs
      prisma.membership.count({
        where: { 
          gym_id: gymId, 
          status: 'ACTIVE' 
        }
      }),

      // Sessions cette semaine
      prisma.jarvisSession.count({
        where: {
          gym_id: gymId,
          start_time: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return {
      active_sessions: activeSessions,
      today_sessions: todayMetrics?.total_sessions ?? 0,
      today_interactions: todayMetrics?.total_interactions ?? 0,
      total_members: totalMembers,
      week_sessions: thisWeekSessions,
      satisfaction_score: todayMetrics?.satisfaction_score ?? null
    }
  }
}

export default GymService

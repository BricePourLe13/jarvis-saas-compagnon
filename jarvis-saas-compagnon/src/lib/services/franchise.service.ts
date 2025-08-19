/**
 * 🏢 FRANCHISE SERVICE - Architecture propre
 * Gestion complète des franchises avec Prisma
 */

import { prisma } from '../prisma'
import { Franchise, Gym, User } from '../../../generated/prisma'

export class FranchiseService {
  
  /**
   * 🔍 Récupérer toutes les franchises (Super Admin)
   */
  static async getAllFranchises(): Promise<Franchise[]> {
    return await prisma.franchise.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        gyms: {
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            city: true,
            is_active: true,
            _count: { select: { memberships: true } }
          }
        },
        _count: { select: { gyms: true } }
      },
      orderBy: { created_at: 'desc' }
    })
  }

  /**
   * 🏢 Récupérer franchise par owner (Franchise Owner)
   */
  static async getFranchiseByOwner(ownerId: string): Promise<Franchise | null> {
    return await prisma.franchise.findFirst({
      where: { owner_id: ownerId },
      include: {
        gyms: {
          include: {
            manager: { select: { id: true, name: true, email: true } },
            _count: { select: { memberships: true, jarvis_sessions: true } }
          }
        }
      }
    })
  }

  /**
   * ➕ Créer nouvelle franchise
   */
  static async createFranchise(data: {
    name: string
    slug: string
    description?: string
    owner_id: string
    email?: string
    phone?: string
    address?: string
    city?: string
    postal_code?: string
  }): Promise<Franchise> {
    return await prisma.franchise.create({
      data,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        gyms: true
      }
    })
  }

  /**
   * 📊 Stats franchise
   */
  static async getFranchiseStats(franchiseId: string) {
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: {
        gyms: {
          include: {
            _count: { 
              select: { 
                memberships: true, 
                jarvis_sessions: true 
              } 
            }
          }
        }
      }
    })

    if (!franchise) return null

    const totalGyms = franchise.gyms.length
    const activeGyms = franchise.gyms.filter(g => g.is_active).length
    const totalMembers = franchise.gyms.reduce((sum, gym) => sum + gym._count.memberships, 0)
    const totalSessions = franchise.gyms.reduce((sum, gym) => sum + gym._count.jarvis_sessions, 0)

    return {
      franchise,
      stats: {
        total_gyms: totalGyms,
        active_gyms: activeGyms,
        total_members: totalMembers,
        total_sessions: totalSessions
      }
    }
  }
}

export default FranchiseService

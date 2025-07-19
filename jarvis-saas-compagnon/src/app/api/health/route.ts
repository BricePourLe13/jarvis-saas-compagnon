// 🏥 Health Check API - Monitoring infrastructure
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, apiLimiter } from '../../../lib/rate-limiter'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: {
      status: 'up' | 'down' | 'degraded'
      latency?: number
      error?: string
    }
    auth: {
      status: 'up' | 'down'
      error?: string
    }
    api: {
      status: 'up'
      rateLimit: {
        remaining: number
        resetTime: number
      }
    }
  }
  performance: {
    uptime: number
    memory: {
      used: number
      total: number
    }
  }
  version: string
}

async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down' | 'degraded'
  latency?: number
  error?: string
}> {
  try {
    const startTime = Date.now()
    
    // Test simple de connexion Supabase
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
    
    const latency = Date.now() - startTime
    
    if (response.ok) {
      return {
        status: latency > 1000 ? 'degraded' : 'up',
        latency
      }
    } else {
      return {
        status: 'down',
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkAuthHealth(): Promise<{
  status: 'up' | 'down'
  error?: string
}> {
  try {
    // Test simple de l'endpoint auth
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    })
    
    return {
      status: response.ok ? 'up' : 'down',
      error: response.ok ? undefined : `HTTP ${response.status}`
    }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function healthCheckHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Tests parallèles des services
    const [dbHealth, authHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkAuthHealth()
    ])

    // Informations sur le rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'health-check'
    const rateLimitInfo = apiLimiter.isAllowed(`health-${clientId}`)

    // Métriques de performance (approximatives en serverless)
    const memoryUsage = process.memoryUsage()

    const healthStatus: HealthStatus = {
      status: 
        dbHealth.status === 'down' || authHealth.status === 'down' ? 'unhealthy' :
        dbHealth.status === 'degraded' ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        auth: authHealth,
        api: {
          status: 'up',
          rateLimit: {
            remaining: rateLimitInfo.remaining || 0,
            resetTime: rateLimitInfo.resetTime || 0
          }
        }
      },
      performance: {
        uptime: Date.now() - startTime, // Temps de traitement de cette requête
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
        }
      },
      version: process.env.npm_package_version || '1.0.0'
    }

    const statusCode = 
      healthStatus.status === 'healthy' ? 200 :
      healthStatus.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthStatus, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    })

  } catch (error) {
    console.error('❌ [HEALTH] Erreur critique lors du health check:', error)
    
    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'down', error: 'Health check failed' },
        auth: { status: 'down', error: 'Health check failed' },
        api: { status: 'up', rateLimit: { remaining: 0, resetTime: 0 } }
      },
      performance: {
        uptime: 0,
        memory: { used: 0, total: 0 }
      },
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(errorStatus, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    })
  }
}

// Export avec rate limiting
export const GET = withRateLimit(healthCheckHandler, apiLimiter)

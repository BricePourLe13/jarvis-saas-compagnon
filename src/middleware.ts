import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/production-logger'
import { apiRateLimiter, voiceRateLimiter, getClientIdentifier } from '@/lib/rate-limiter-simple'
import { 
  verifyAuthMiddleware, 
  getUserProfile, 
  canAccessRoute, 
  getDefaultRedirectForRole 
} from '@/lib/auth-helpers'

// ============================================================================
// MIDDLEWARE PRINCIPAL - Auth + Rate limiting + Permissions
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  
  logger.debug(`MIDDLEWARE ${pathname}`, { userAgent: userAgent.substring(0, 50) }, { component: 'Middleware' })

  // ============================================================================
  // 🔐 PROTECTION AUTH : /dashboard et /admin
  // ============================================================================
  
  const protectedPaths = ['/dashboard', '/admin']
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedRoute) {
    try {
      // 1. Vérifier l'authentification
      const { supabase, response, authUser, error } = await verifyAuthMiddleware(request)

      // 2. Si pas authentifié → redirect /login
      if (error || !authUser) {
        logger.warn('🔒 [AUTH] Utilisateur non authentifié', { pathname }, { component: 'Middleware' })
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // 3. Récupérer le profil complet
      const userProfile = await getUserProfile(supabase, authUser.id)

      // 4. Si profil invalide ou inactif → redirect /login
      if (!userProfile || !userProfile.is_active) {
        logger.warn('🔒 [AUTH] Compte inactif ou invalide', { userId: authUser.id }, { component: 'Middleware' })
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'account_inactive')
        return NextResponse.redirect(loginUrl)
      }

      // 5. Vérifier les permissions pour cette route
      const { allowed, redirectTo } = canAccessRoute(userProfile, pathname)

      if (!allowed && redirectTo) {
        logger.warn(
          '🔒 [AUTH] Accès refusé', 
          { userId: userProfile.id, role: userProfile.role, pathname, redirectTo }, 
          { component: 'Middleware' }
        )
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }

      // 6. Redirection racine dashboard selon rôle
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        const defaultRoute = getDefaultRedirectForRole(userProfile)
        if (defaultRoute !== '/dashboard') {
          logger.debug(
            '🎯 [AUTH] Redirection selon rôle', 
            { role: userProfile.role, redirectTo: defaultRoute }, 
            { component: 'Middleware' }
          )
          return NextResponse.redirect(new URL(defaultRoute, request.url))
        }
      }

      // 7. Auth OK → ajouter headers user pour les API routes
      response.headers.set('X-User-Id', userProfile.id)
      response.headers.set('X-User-Role', userProfile.role)
      if (userProfile.gym_id) {
        response.headers.set('X-User-Gym-Id', userProfile.gym_id)
      }

      logger.debug(
        '✅ [AUTH] Accès autorisé', 
        { userId: userProfile.id, role: userProfile.role, pathname }, 
        { component: 'Middleware' }
      )

      return response
    } catch (authError) {
      logger.error(
        '❌ [AUTH] Erreur middleware auth', 
        { error: authError, pathname }, 
        { component: 'Middleware' }
      )
      // En cas d'erreur auth → redirect login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'auth_error')
      return NextResponse.redirect(loginUrl)
    }
  }

  // ============================================================================
  // 🚦 RATE LIMITING
  // ============================================================================
  
  const clientId = getClientIdentifier(request)
  
  // ⚠️ EXCEPTION : Skip rate limiting for webhooks (trusted external services)
  if (pathname.startsWith('/api/webhooks/')) {
    logger.debug(`Webhook request bypassing rate limit`, { pathname }, { component: 'Middleware' })
    return NextResponse.next()
  }
  
  if (pathname.startsWith('/api/voice/')) {
    const { allowed, remaining, resetTime } = voiceRateLimiter.isAllowed(clientId)
    if (!allowed) {
      logger.warn(`Rate limit exceeded for voice API`, { clientId, pathname }, { component: 'RateLimiter' })
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
        }
      })
    }
  } else if (pathname.startsWith('/api/')) {
    const { allowed, remaining, resetTime } = apiRateLimiter.isAllowed(clientId)
    if (!allowed) {
      logger.warn(`Rate limit exceeded for API`, { clientId, pathname }, { component: 'RateLimiter' })
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
        }
      })
    }
  }

  // ✅ Apply to kiosk routes and landing page with voice interface
  if (pathname.startsWith('/kiosk/') || pathname.startsWith('/landing-client')) {
    const response = NextResponse.next()
    
    // ✅ Browser detection for specific strategies
    const browserInfo = detectBrowser(userAgent)
    logger.debug(`Browser detected: ${browserInfo.name} ${browserInfo.version}`, browserInfo, { component: 'Middleware' })
    
    // ✅ Multi-layer permissions strategy
    setAdvancedPermissionsHeaders(response, browserInfo)
    
    // ✅ Add browser-specific hints
    setBrowserSpecificHeaders(response, browserInfo)
    
    // ✅ Security & performance headers for WebRTC
    setWebRTCOptimizationHeaders(response)
    
    // ✅ CORS for microphone access
    setCORSHeaders(response)
    
    logger.debug(`Applied advanced permissions for ${browserInfo.name}`, null, { component: 'Middleware' })
    return response
  }

  return NextResponse.next()
}

// ✅ Browser detection with version support
function detectBrowser(userAgent: string) {
  const browsers = [
    { name: 'Chrome', regex: /Chrome\/(\d+)/, mobile: /Mobile/ },
    { name: 'Firefox', regex: /Firefox\/(\d+)/, mobile: /Mobile/ },
    { name: 'Safari', regex: /Safari\/(\d+)/, mobile: /Mobile/ },
    { name: 'Edge', regex: /Edg\/(\d+)/, mobile: /Mobile/ }
  ]

  for (const browser of browsers) {
    const match = userAgent.match(browser.regex)
    if (match) {
      return {
        name: browser.name,
        version: parseInt(match[1]),
        isMobile: browser.mobile.test(userAgent),
        userAgent
      }
    }
  }

  return { name: 'Unknown', version: 0, isMobile: false, userAgent }
}

// ✅ Advanced permissions headers - multi-layer approach
function setAdvancedPermissionsHeaders(response: NextResponse, browserInfo: Record<string, unknown>) {
  // ✅ Modern Permissions-Policy (Chrome 88+, Firefox, Safari 16.4+)
  const permissionsPolicy = [
    'microphone=(self)',
    'camera=(self)', 
    'display-capture=(self)',
    'autoplay=(self)',
    'encrypted-media=(self)',
    'fullscreen=(self)',
    'picture-in-picture=(self)',
    'web-share=(self)',
    'clipboard-write=(self)'
  ].join(', ')
  
  response.headers.set('Permissions-Policy', permissionsPolicy)
  
  // ✅ Legacy Feature-Policy (Chrome 60-87, older browsers)
  const featurePolicy = [
    "microphone 'self'",
    "camera 'self'",
    "display-capture 'self'",
    "autoplay 'self'", 
    "encrypted-media 'self'",
    "fullscreen 'self'",
    "picture-in-picture 'self'"
  ].join('; ')
  
  response.headers.set('Feature-Policy', featurePolicy)
  
  // ✅ Browser-specific overrides
  if (browserInfo.name === 'Safari' && browserInfo.version < 16) {
    // Safari older versions need explicit allow directives
    response.headers.set('Permissions-Policy', 'microphone=*, camera=*, autoplay=*')
  }
  
  if (browserInfo.name === 'Firefox' && browserInfo.version < 90) {
    // Firefox older versions prefer Feature-Policy
    response.headers.delete('Permissions-Policy')
  }
}

// ✅ Browser-specific headers and hints
function setBrowserSpecificHeaders(response: NextResponse, browserInfo: Record<string, unknown>) {
  // ✅ Chrome-specific optimizations
  if (browserInfo.name === 'Chrome') {
    response.headers.set('Accept-CH', 'Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform')
    response.headers.set('Critical-CH', 'Sec-CH-UA-Mobile')
    
    // Chrome experimental flags
    response.headers.set('Origin-Trial', 'WebRTC-Unlimited-Media-Policy') // If available
  }
  
  // ✅ Firefox-specific optimizations
  if (browserInfo.name === 'Firefox') {
    // Firefox prefers explicit CORS
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  // ✅ Safari-specific optimizations
  if (browserInfo.name === 'Safari') {
    // Safari needs explicit autoplay policy
    response.headers.set('Autoplay-Policy', 'user-gesture-required')
    
    // Safari prefers stricter CSP
                const safariCSP = [
              "default-src 'self'",
              "media-src 'self' blob: mediastream:",
              "connect-src 'self' wss: https: *.hcaptcha.com *.supabase.co *.vercel.app *.sentry.io https://o4509881543819264.ingest.de.sentry.io wss://api.openai.com https://api.openai.com",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.hcaptcha.com",
              "style-src 'self' 'unsafe-inline'",
              "frame-src *.hcaptcha.com"
            ].join('; ')
    response.headers.set('Content-Security-Policy', safariCSP)
  }
  
  // ✅ Mobile-specific headers
  if (browserInfo.isMobile) {
    response.headers.set('Viewport-Fit', 'cover')
    response.headers.set('Touch-Action', 'manipulation')
  }
}

// ✅ WebRTC optimization headers
function setWebRTCOptimizationHeaders(response: NextResponse) {
  // ✅ Content Security Policy for WebRTC
          const cspDirectives = [
          "default-src 'self'",
          "media-src 'self' blob: mediastream:",
          "connect-src 'self' wss: https: *.openai.com *.hcaptcha.com *.supabase.co *.vercel.app *.sentry.io https://o4509881543819264.ingest.de.sentry.io",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.hcaptcha.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "worker-src 'self' blob:",
          "frame-src *.hcaptcha.com"
        ]
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // ✅ Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // ✅ Cache headers for static assets
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
}

// ✅ CORS headers for cross-origin requests - SÉCURISÉ
function setCORSHeaders(response: NextResponse) {
  // 🔒 CORS sécurisé - uniquement domaines autorisés
  const allowedOrigins = [
    'https://jarvis-group.net',
    'https://jarvis-saas-compagnon.vercel.app',
    'https://jarvis-compagnon.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : [])
  ]
  
  const origin = response.headers.get('origin')
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (process.env.NODE_ENV === 'development') {
    // En développement, plus permissif mais logué
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With'
  )
}

// ============================================================================
// CONFIGURATION MATCHER
// ============================================================================

export const config = {
  matcher: [
    // Auth protection
    '/dashboard/:path*',
    '/admin/:path*',
    // Kiosk & landing
    '/kiosk/:path*',
    '/landing-client/:path*',
    // API routes (rate limiting)
    '/api/voice/:path*',
    '/api/conversations/:path*',
    '/api/jarvis/:path*',
  ]
}

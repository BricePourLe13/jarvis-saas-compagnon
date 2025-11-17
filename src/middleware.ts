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
  // ­ƒöÉ PROTECTION AUTH : /dashboard et /admin
  // ============================================================================
  
  const protectedPaths = ['/dashboard', '/admin']
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedRoute) {
    try {
      // 1. V├®rifier l'authentification
      const { supabase, response, authUser, error } = await verifyAuthMiddleware(request)

      // 2. Si pas authentifi├® ÔåÆ redirect /login
      if (error || !authUser) {
        logger.warn('­ƒöÆ [AUTH] Utilisateur non authentifi├®', { pathname }, { component: 'Middleware' })
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // 3. R├®cup├®rer le profil complet
      const userProfile = await getUserProfile(supabase, authUser.id)

      // 4. Si profil invalide ou inactif ÔåÆ redirect /login
      if (!userProfile || !userProfile.is_active) {
        logger.warn('­ƒöÆ [AUTH] Compte inactif ou invalide', { userId: authUser.id }, { component: 'Middleware' })
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'account_inactive')
        return NextResponse.redirect(loginUrl)
      }

      // 5. V├®rifier les permissions pour cette route
      const { allowed, redirectTo } = canAccessRoute(userProfile, pathname)

      if (!allowed && redirectTo) {
        logger.warn(
          '­ƒöÆ [AUTH] Acc├¿s refus├®', 
          { userId: userProfile.id, role: userProfile.role, pathname, redirectTo }, 
          { component: 'Middleware' }
        )
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }

      // 6. Redirection racine dashboard selon r├┤le
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        const defaultRoute = getDefaultRedirectForRole(userProfile)
        if (defaultRoute !== '/dashboard') {
          logger.debug(
            '­ƒÄ» [AUTH] Redirection selon r├┤le', 
            { role: userProfile.role, redirectTo: defaultRoute }, 
            { component: 'Middleware' }
          )
          return NextResponse.redirect(new URL(defaultRoute, request.url))
        }
      }

      // 7. Auth OK ÔåÆ ajouter headers user pour les API routes
      response.headers.set('X-User-Id', userProfile.id)
      response.headers.set('X-User-Role', userProfile.role)
      if (userProfile.gym_id) {
        response.headers.set('X-User-Gym-Id', userProfile.gym_id)
      }

      logger.debug(
        'Ô£à [AUTH] Acc├¿s autoris├®', 
        { userId: userProfile.id, role: userProfile.role, pathname }, 
        { component: 'Middleware' }
      )

      return response
    } catch (authError) {
      logger.error(
        'ÔØî [AUTH] Erreur middleware auth', 
        { error: authError, pathname }, 
        { component: 'Middleware' }
      )
      // En cas d'erreur auth ÔåÆ redirect login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'auth_error')
      return NextResponse.redirect(loginUrl)
    }
  }

  // ============================================================================
  // ­ƒÜª RATE LIMITING
  // ============================================================================
  
  const clientId = getClientIdentifier(request)
  
  // ÔÜá´©Å EXCEPTION : Skip rate limiting for webhooks (trusted external services)
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

  // Ô£à Apply to kiosk routes and landing page with voice interface
  if (pathname.startsWith('/kiosk/') || pathname.startsWith('/landing-client')) {
    const response = NextResponse.next()
    
    // Ô£à Browser detection for specific strategies
    const browserInfo = detectBrowser(userAgent)
    logger.debug(`Browser detected: ${browserInfo.name} ${browserInfo.version}`, browserInfo, { component: 'Middleware' })
    
    // Ô£à Multi-layer permissions strategy
    setAdvancedPermissionsHeaders(response, browserInfo)
    
    // Ô£à Add browser-specific hints
    setBrowserSpecificHeaders(response, browserInfo)
    
    // Ô£à Security & performance headers for WebRTC
    setWebRTCOptimizationHeaders(response)
    
    // Ô£à CORS for microphone access
    setCORSHeaders(response)
    
    logger.debug(`Applied advanced permissions for ${browserInfo.name}`, null, { component: 'Middleware' })
    return response
  }

  return NextResponse.next()
}

// Ô£à Browser detection with version support
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

// Ô£à Advanced permissions headers - multi-layer approach
function setAdvancedPermissionsHeaders(response: NextResponse, browserInfo: Record<string, unknown>) {
  // Ô£à Modern Permissions-Policy (Chrome 88+, Firefox, Safari 16.4+)
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
  
  // Ô£à Legacy Feature-Policy (Chrome 60-87, older browsers)
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
  
  // Ô£à Browser-specific overrides
  if (browserInfo.name === 'Safari' && browserInfo.version < 16) {
    // Safari older versions need explicit allow directives
    response.headers.set('Permissions-Policy', 'microphone=*, camera=*, autoplay=*')
  }
  
  if (browserInfo.name === 'Firefox' && browserInfo.version < 90) {
    // Firefox older versions prefer Feature-Policy
    response.headers.delete('Permissions-Policy')
  }
}

// Ô£à Browser-specific headers and hints
function setBrowserSpecificHeaders(response: NextResponse, browserInfo: Record<string, unknown>) {
  // Ô£à Chrome-specific optimizations
  if (browserInfo.name === 'Chrome') {
    response.headers.set('Accept-CH', 'Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform')
    response.headers.set('Critical-CH', 'Sec-CH-UA-Mobile')
    
    // Chrome experimental flags
    response.headers.set('Origin-Trial', 'WebRTC-Unlimited-Media-Policy') // If available
  }
  
  // Ô£à Firefox-specific optimizations
  if (browserInfo.name === 'Firefox') {
    // Firefox prefers explicit CORS
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  // Ô£à Safari-specific optimizations
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
  
  // Ô£à Mobile-specific headers
  if (browserInfo.isMobile) {
    response.headers.set('Viewport-Fit', 'cover')
    response.headers.set('Touch-Action', 'manipulation')
  }
}

// Ô£à WebRTC optimization headers
function setWebRTCOptimizationHeaders(response: NextResponse) {
  // Ô£à Content Security Policy for WebRTC
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
  
  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
}

// ============================================================================
// CONFIGURATION MIDDLEWARE
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|.*\\..*$).*)',
  ],
}

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/production-logger'
import { apiRateLimiter, voiceRateLimiter, getClientIdentifier } from '@/lib/rate-limiter-simple'

// ✅ SOLUTION 3: Advanced Browser Permissions Middleware + Fallback Strategies
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  
  logger.debug(`MIDDLEWARE ${pathname}`, { userAgent: userAgent.substring(0, 50) }, { component: 'Middleware' })

  // 🚦 Rate limiting pour les routes sensibles
  const clientId = getClientIdentifier(request)
  
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

  // ✅ Only apply to kiosk routes
  if (pathname.startsWith('/kiosk/')) {
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
              "connect-src 'self' wss: https: *.hcaptcha.com *.supabase.co *.vercel.app *.sentry.io",
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
          "connect-src 'self' wss: https: *.openai.com *.hcaptcha.com *.supabase.co *.vercel.app *.sentry.io",
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

// ✅ Apply to kiosk routes and APIs
export const config = {
  matcher: [
    '/kiosk/:path*',
    '/api/voice/:path*',
    '/api/conversations/:path*',
    '/api/jarvis/:path*'
  ]
}

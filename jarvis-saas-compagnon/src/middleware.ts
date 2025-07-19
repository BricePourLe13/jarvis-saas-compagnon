import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { apiLimiter, authLimiter, adminLimiter, getClientIdentifier } from './lib/rate-limiter'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🛡️ Rate Limiting par endpoint
  const clientId = getClientIdentifier(request)
  
  // Rate limiting spécialisé par route
  let rateLimitResult
  if (pathname.startsWith('/api/auth')) {
    rateLimitResult = authLimiter.isAllowed(clientId)
  } else if (pathname.startsWith('/admin')) {
    rateLimitResult = adminLimiter.isAllowed(clientId)
  } else if (pathname.startsWith('/api/')) {
    rateLimitResult = apiLimiter.isAllowed(clientId)
  }

  // Bloquer si rate limit dépassé
  if (rateLimitResult && !rateLimitResult.allowed) {
    console.warn(`🚨 [SÉCURITÉ] Rate limit dépassé pour ${clientId} sur ${pathname}`)
    
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Trop de requêtes. Veuillez patienter.',
        resetTime: rateLimitResult.resetTime
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString()
        }
      }
    )
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Rafraîchir la session si nécessaire
  const { data: { session } } = await supabase.auth.getSession()

  // Protéger les routes admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // Rediriger vers la page d'accueil avec un paramètre pour ouvrir la modal de connexion
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth', 'required')
      return NextResponse.redirect(redirectUrl)
    }

    // Vérifier le rôle pour les routes admin
    if (session.user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!userProfile || !['super_admin', 'franchise_owner', 'franchise_admin'].includes(userProfile.role)) {
        // Pas autorisé à accéder à l'admin
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

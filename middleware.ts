import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth-edge'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── 1. Admin Console Route Protection ────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value
    const { valid } = await verifyAdminSessionToken(adminCookie)

    // Dedicated admin login page
    if (pathname === '/admin/login') {
      if (valid) {
        // Already authenticated as admin -> go to dashboard
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return NextResponse.next({ request })
    }

    // All other /admin routes require valid admin session
    if (!valid) {
      const loginUrl = new URL('/admin/login', request.url)
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirectedFrom', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next({ request })
  }

  // ── 2. Consumer Supabase Client & Route Protection ───────────────────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() — validates JWT with Supabase server (more secure than getSession())
  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/profile', '/submit', '/saved']
  const isProtectedRoute = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
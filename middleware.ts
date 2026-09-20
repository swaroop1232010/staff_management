import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, AUTH_COOKIE_NAME } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const user = token ? await verifyJWT(token) : null

  const isLoginPage = pathname === '/login'
  const isApiRoute = pathname.startsWith('/api/')

  // 1. If user is already authenticated and visits /login, redirect to their home
  if (isLoginPage) {
    if (user) {
      const target = user.role === 'SUPERADMIN' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(target, request.url))
    }
    return NextResponse.next()
  }

  // 2. Protected API Routes
  if (isApiRoute) {
    // Allow public access to auth endpoints and health check
    if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/init-db')) {
      return NextResponse.next()
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    // Reports API is restricted to SUPERADMIN
    if (pathname.startsWith('/api/reports') && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 })
    }

    return NextResponse.next()
  }

  // 3. Protected Pages (/admin, /dashboard, /staff, /import-export)
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Restrict /admin and /dashboard/reports to SUPERADMIN
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/reports')) {
    if (user.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/staff/:path*',
    '/import-export/:path*',
    '/login',
    '/api/customers/:path*',
    '/api/staff/:path*',
    '/api/reports/:path*',
    '/api/upload/:path*',
  ],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/signup']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p)) {
    return NextResponse.next()
  }

  // Allow API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for auth token in cookie (we use localStorage but can also use cookie)
  // For middleware we rely on a cookie set on login
  const token = req.cookies.get('lexguard_token')?.value
  
  if (!token && pathname.startsWith('/dashboard') || 
      !token && pathname.startsWith('/analyze') ||
      !token && pathname.startsWith('/history') ||
      !token && pathname.startsWith('/playbooks') ||
      !token && pathname.startsWith('/compare') ||
      !token && pathname.startsWith('/report')) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

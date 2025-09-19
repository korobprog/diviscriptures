import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Protect API routes that require authentication
    if (isApiRoute && !isAuth && !req.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Protect admin routes
    if (req.nextUrl.pathname.startsWith('/admin') && isAuth) {
      if (token?.role !== 'ADMIN' && token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Protect super admin routes
    if (req.nextUrl.pathname.startsWith('/super-admin') && isAuth) {
      if (token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
        const isApiRoute = req.nextUrl.pathname.startsWith('/api')
        const isPublicPage = ['/', '/groups', '/about'].includes(req.nextUrl.pathname)

        // Allow access to auth pages and public pages without token
        if (isAuthPage || isPublicPage) {
          return true
        }

        // Require token for API routes (except auth routes)
        if (isApiRoute && !req.nextUrl.pathname.startsWith('/api/auth')) {
          return !!token
        }

        // Require token for protected pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Временно отключаем middleware для диагностики
    // '/admin/:path*',
    // '/super-admin/:path*',
    // '/api/:path*',
    // '/auth/:path*',
    // '/dashboard/:path*',
    // '/profile/:path*',
  ],
}

import type { NextRequest } from 'next/server'

// TEMPORARY: return 404 for all routes
export function middleware(_request: NextRequest) {
  return new Response('404 Not Found', { status: 404 })
}

export const config = {
  matcher: '/:path*',
}

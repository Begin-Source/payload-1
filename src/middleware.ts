import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { defaultLocale, isAppLocale } from '@/i18n/config'
import { hostNameLabel } from '@/utilities/normalizeRequestHost'

const LOCAL_LABELS = new Set(['localhost', '127.0.0.1', '::1'])

const SKIP_LOCALE_PREFIXES = ['/admin', '/api', '/_next', '/favicon.ico', '/my-route']

function shouldSkipLocale(pathname: string): boolean {
  if (pathname.startsWith('/_next')) return true
  return SKIP_LOCALE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function redirectLookupSecret(): string {
  return process.env.INTERNAL_REDIRECT_SECRET?.trim() || 'development-redirect-secret'
}

async function cmsRedirect(
  pathname: string,
  requestUrl: string,
  forward: Headers,
): Promise<{ toPath: string; statusCode: number } | null> {
  const url = new URL('/api/redirect-lookup', requestUrl)
  url.searchParams.set('path', pathname)
  const res = await fetch(url.toString(), {
    headers: {
      'x-redirect-secret': redirectLookupSecret(),
      host: forward.get('host') ?? '',
      'x-forwarded-host': forward.get('x-forwarded-host') ?? '',
      'x-site-slug': forward.get('x-site-slug') ?? '',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { hit?: boolean; toPath?: string; statusCode?: number }
  if (!data.hit || !data.toPath) return null
  return { toPath: data.toPath, statusCode: data.statusCode === 302 ? 302 : 301 }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const label = hostNameLabel(request.headers.get('host'))
  const isLocal = Boolean(label && LOCAL_LABELS.has(label))

  const requestHeaders = new Headers(request.headers)
  if (isLocal) {
    const site = request.nextUrl.searchParams.get('site')
    if (site?.trim()) {
      requestHeaders.set('x-site-slug', site.trim())
    }
  }

  if (shouldSkipLocale(pathname)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  if (pathname === '/') {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  if (!first || !isAppLocale(first)) {
    const url = request.nextUrl.clone()
    const suffix = pathname === '/' ? '' : pathname
    url.pathname = `/${defaultLocale}${suffix}`
    url.search = request.nextUrl.search
    return NextResponse.redirect(url, 308)
  }

  const hit = await cmsRedirect(pathname, request.url, requestHeaders)
  if (hit) {
    const target = hit.toPath
    const dest = target.startsWith('http://') || target.startsWith('https://')
      ? target
      : new URL(target, request.url).toString()
    return NextResponse.redirect(dest, hit.statusCode)
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

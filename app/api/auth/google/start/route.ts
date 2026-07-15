import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL
const STATE_COOKIE_NAME = 'google_oauth_state'

// Build the current application base URL from the incoming request.
// This is important for Vercel deployments where the host may change.
function resolveBaseUrl(requestUrl: string, headers: Headers) {
  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = headers.get('host')

  if (forwardedProto && (forwardedHost || host)) {
    return `${forwardedProto}://${forwardedHost || host}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  return new URL(requestUrl).origin
}

function resolveRedirectUri(requestUrl: string, headers: Headers, configuredUri?: string) {
  const requestOrigin = resolveBaseUrl(requestUrl, headers)
  const fallbackUri = `${requestOrigin}/api/auth/google/callback`

  // Validate the configured redirect URI happens to match the current origin.
  // If it does not, fall back to the request host so Google callback remains valid.

  if (!configuredUri) {
    return fallbackUri
  }

  try {
    const parsed = new URL(configuredUri)
    const isMatchingOrigin = parsed.origin === new URL(requestOrigin).origin
    const isCallbackPath = parsed.pathname.replace(/\/+$/, '') === '/api/auth/google/callback'

    if (isMatchingOrigin && isCallbackPath) {
      return parsed.toString()
    }
  } catch {
    // fall back to the current request origin
  }

  return fallbackUri
}

export async function GET(req: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    )
  }

  const redirectUri = resolveRedirectUri(req.url, req.headers, GOOGLE_REDIRECT_URI)
  // The redirect URI that Google uses after login must be registered in the
  // Google Cloud OAuth client settings for the current domain.
  // Example: https://ai-reminder-web-app-xi.vercel.app/api/auth/google/callback
  const state = randomBytes(16).toString('hex')
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  // Build the Google authorization request URL.
  // The redirect_uri must match the authorized redirect URI in Google Cloud.
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'select_account')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/google/callback',
    maxAge: 300,
  })

  return response
}

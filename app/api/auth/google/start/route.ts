import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL
const STATE_COOKIE_NAME = 'google_oauth_state'

function resolveRedirectUri(requestUrl: string, configuredUri?: string) {
  const requestOrigin = new URL(requestUrl).origin
  if (!configuredUri) {
    return `${requestOrigin}/api/auth/google/callback`
  }

  try {
    const parsed = new URL(configuredUri)
    const isMatchingOrigin = parsed.origin === requestOrigin
    const isCallbackPath = parsed.pathname.replace(/\/+$/, '') === '/api/auth/google/callback'

    if (isMatchingOrigin && isCallbackPath) {
      return parsed.toString()
    }
  } catch {
    // fall back to the current request origin
  }

  return `${requestOrigin}/api/auth/google/callback`
}

export async function GET(req: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    )
  }

  const redirectUri = resolveRedirectUri(req.url, GOOGLE_REDIRECT_URI)

  const state = randomBytes(16).toString('hex')
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
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

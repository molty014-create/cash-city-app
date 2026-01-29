import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, errorResponse, successResponse } from '../_shared/cors.ts'

// Twitter OAuth 2.0 credentials
const CLIENT_ID = Deno.env.get('TWITTER_CLIENT_ID') || ''
const CLIENT_SECRET = Deno.env.get('TWITTER_CLIENT_SECRET') || ''
const REDIRECT_URI = Deno.env.get('TWITTER_REDIRECT_URI') || ''

// Generate random string for state/code_verifier
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

// Generate code challenge from verifier (SHA256 + base64url)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    // Step 1: Generate auth URL
    if (action === 'authorize') {
      const frontendRedirect = url.searchParams.get('redirect') || 'http://localhost:5173'

      const state = generateRandomString(32)
      const codeVerifier = generateRandomString(64)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      const frontendCallback = url.searchParams.get('redirect') || 'http://localhost:5173'

      const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('client_id', CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', frontendCallback)
      authUrl.searchParams.set('scope', 'tweet.read users.read offline.access')
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      authUrl.searchParams.set('force_login', 'true')

      return successResponse(
        {
          auth_url: authUrl.toString(),
          state,
          code_verifier: codeVerifier,
          frontend_redirect: frontendRedirect
        },
        corsHeaders
      )
    }

    // Step 2: Exchange code for tokens
    if (action === 'callback') {
      const code = url.searchParams.get('code')
      const codeVerifier = url.searchParams.get('code_verifier')

      if (!code || !codeVerifier) {
        return errorResponse('Missing code or code_verifier', 400, corsHeaders)
      }

      const redirectUri = url.searchParams.get('redirect_uri') || REDIRECT_URI

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        })
      })

      if (!tokenResponse.ok) {
        return errorResponse('Token exchange failed', 400, corsHeaders)
      }

      const tokens = await tokenResponse.json()

      // Get user info
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })

      if (!userResponse.ok) {
        return errorResponse('Failed to get user info', 400, corsHeaders)
      }

      const userData = await userResponse.json()

      return successResponse(
        {
          success: true,
          user: {
            id: userData.data.id,
            name: userData.data.name,
            username: userData.data.username,
            profile_image_url: userData.data.profile_image_url,
            followers_count: userData.data.public_metrics?.followers_count || 0
          },
          access_token: tokens.access_token
        },
        corsHeaders
      )
    }

    return errorResponse('Invalid action. Use ?action=authorize or ?action=callback', 400, corsHeaders)

  } catch (error) {
    return errorResponse('Internal server error', 500, corsHeaders)
  }
})

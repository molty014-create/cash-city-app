// Shared CORS and validation utilities for edge functions

// Allowed origins - add your production domains here
const ALLOWED_ORIGINS = [
  'https://cashcity.fun',
  'https://www.cashcity.fun',
  // Allow localhost for development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]

// Check if origin is allowed (includes Vercel preview URLs)
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false

  // Exact match
  if (ALLOWED_ORIGINS.includes(origin)) return true

  // Allow localhost on any port
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true

  // Allow Vercel preview URLs
  if (origin.includes('.vercel.app')) return true

  // Allow cashcity subdomains
  if (origin.endsWith('.cashcity.fun') || origin === 'https://cashcity.fun') return true

  return false
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || ''

  // Check if origin is allowed - if so, echo it back; otherwise use production domain
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://cashcity.fun'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  }
}

// Validate Solana wallet address format (Base58, 32-44 chars)
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false

  // Solana addresses are Base58 encoded, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  return base58Regex.test(address)
}

// Sanitize Twitter handle
export function sanitizeTwitterHandle(handle: string): string {
  if (!handle || typeof handle !== 'string') return ''

  // Remove all @ symbols and trim
  return handle.replace(/@/g, '').trim().toLowerCase()
}

// Basic rate limiting using KV (requires Deno KV or similar)
// For production, consider using Upstash Redis
export async function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  // This is a placeholder - implement with Upstash Redis or Deno KV in production
  // For now, always allow (rate limiting disabled)
  return { allowed: true, remaining: maxRequests }
}

// Create error response with CORS headers
export function errorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Create success response with CORS headers
export function successResponse(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  additionalHeaders?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...additionalHeaders
      }
    }
  )
}

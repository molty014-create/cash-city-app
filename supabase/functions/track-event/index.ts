import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isValidSolanaAddress, sanitizeTwitterHandle, successResponse, errorResponse } from '../_shared/cors.ts'

const VALID_EVENTS = [
  'page_view',
  'wallet_connected',
  'twitter_linked',
  'application_submitted',
  'image_generated',
  'tweet_verified'
] as const

type EventName = typeof VALID_EVENTS[number]

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event_name, wallet_address, twitter_username, metadata } = await req.json()

    // Validate event name
    if (!event_name || !VALID_EVENTS.includes(event_name as EventName)) {
      return errorResponse(`Invalid event_name. Must be one of: ${VALID_EVENTS.join(', ')}`, 400, corsHeaders)
    }

    // Validate wallet address if provided
    if (wallet_address && !isValidSolanaAddress(wallet_address)) {
      return errorResponse('Invalid wallet address format', 400, corsHeaders)
    }

    // Sanitize Twitter username if provided
    const cleanTwitter = twitter_username ? sanitizeTwitterHandle(twitter_username) : null

    // Create Supabase client with service role for insert
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Insert event
    const { error } = await supabase
      .from('events')
      .insert({
        event_name,
        wallet_address: wallet_address || null,
        twitter_username: cleanTwitter,
        metadata: metadata || {}
      })

    if (error) {
      console.error('Failed to track event:', error)
      // Don't expose internal errors - just acknowledge receipt
      return successResponse({ tracked: false }, corsHeaders)
    }

    return successResponse({ tracked: true }, corsHeaders)

  } catch (error) {
    console.error('Track event error:', error)
    // Fire-and-forget semantics - don't fail loudly
    return successResponse({ tracked: false }, corsHeaders)
  }
})

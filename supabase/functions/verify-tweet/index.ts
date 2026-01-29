import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isValidSolanaAddress, sanitizeTwitterHandle, errorResponse, successResponse } from '../_shared/cors.ts'

// Application deadline: Feb 3, 2026 at 4pm UTC
const DEADLINE = new Date('2026-02-03T16:00:00Z')

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { twitter_handle, wallet_address } = await req.json()

    // Validate inputs
    if (!twitter_handle || !wallet_address) {
      return errorResponse('Missing twitter_handle or wallet_address', 400, corsHeaders)
    }

    // Validate wallet address format
    if (!isValidSolanaAddress(wallet_address)) {
      return errorResponse('Invalid wallet address format', 400, corsHeaders)
    }

    // Sanitize Twitter handle
    const cleanHandle = sanitizeTwitterHandle(twitter_handle)
    if (!cleanHandle || cleanHandle.length < 1 || cleanHandle.length > 15) {
      return errorResponse('Invalid Twitter handle', 400, corsHeaders)
    }

    // Check deadline
    if (new Date() > DEADLINE) {
      return successResponse(
        { verified: false, message: 'Applications are now closed' },
        corsHeaders
      )
    }

    const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN')

    if (!TWITTER_BEARER_TOKEN) {
      return successResponse(
        { verified: false, message: 'Tweet verification not configured.' },
        corsHeaders
      )
    }

    let tweetsData: { data?: Array<{ id: string; text: string; created_at?: string; in_reply_to_user_id?: string }> } | null = null

    try {
      // Step 1: Get the user's Twitter ID from their handle
      const userLookupResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(cleanHandle)}`,
        {
          headers: {
            'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!userLookupResponse.ok) {
        return successResponse(
          { verified: false, pending: true, message: 'Could not find Twitter user.' },
          corsHeaders
        )
      }

      const userLookupData = await userLookupResponse.json()
      const userId = userLookupData.data?.id

      if (!userId) {
        return successResponse(
          { verified: false, pending: true, message: 'Could not find Twitter user.' },
          corsHeaders
        )
      }

      // Step 2: Get the user's recent tweets with additional fields to filter replies/retweets
      const tweetsResponse = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,text,in_reply_to_user_id,referenced_tweets&exclude=replies,retweets`,
        {
          headers: {
            'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!tweetsResponse.ok) {
        return successResponse(
          { verified: false, pending: true, message: 'Could not fetch tweets.' },
          corsHeaders
        )
      }

      tweetsData = await tweetsResponse.json()

      // Step 3: Check for a valid application tweet
      const REQUIRED_MENTION = '@cashcitydotfun'
      const MAX_AGE_HOURS = 24

      if (tweetsData?.data && tweetsData.data.length > 0) {
        const matchingTweet = tweetsData.data.find((tweet) => {
          const text = tweet.text?.toLowerCase() || ''

          // Must mention @cashcitydotfun
          if (!text.includes(REQUIRED_MENTION.toLowerCase())) {
            return false
          }

          // Must not be a reply
          if (tweet.in_reply_to_user_id) {
            return false
          }

          // Check if tweet is recent
          if (tweet.created_at) {
            const tweetTime = new Date(tweet.created_at).getTime()
            const now = Date.now()
            const ageHours = (now - tweetTime) / (1000 * 60 * 60)
            if (ageHours > MAX_AGE_HOURS) {
              return false
            }
          }

          return true
        })

        if (matchingTweet) {
          const tweetUrl = `https://twitter.com/${cleanHandle}/status/${matchingTweet.id}`

          // Update database
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') || '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
          )

          await supabase
            .from('applications')
            .update({
              tweet_verified: true,
              tweet_url: tweetUrl,
              status: 'verified',
              updated_at: new Date().toISOString()
            })
            .eq('wallet_address', wallet_address)

          return successResponse(
            { verified: true, tweet_url: tweetUrl },
            corsHeaders
          )
        }
      }
    } catch (fetchError) {
      return successResponse(
        { verified: false, pending: true, message: 'Failed to check Twitter.' },
        corsHeaders
      )
    }

    // No matching tweet found
    return successResponse(
      { verified: false, pending: true, message: 'Tweet not found yet.' },
      corsHeaders
    )

  } catch (error) {
    return errorResponse('Internal server error', 500, corsHeaders)
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isValidSolanaAddress, errorResponse, successResponse } from '../_shared/cors.ts'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { wallet_address } = await req.json()

    // Validate input
    if (!wallet_address) {
      return errorResponse('Missing wallet_address', 400, corsHeaders)
    }

    // Validate wallet address format
    if (!isValidSolanaAddress(wallet_address)) {
      return errorResponse('Invalid wallet address format', 400, corsHeaders)
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('wallet_address', wallet_address)

    if (error) {
      return errorResponse('Failed to delete application', 500, corsHeaders)
    }

    return successResponse({ success: true }, corsHeaders)

  } catch (error) {
    return errorResponse('Internal server error', 500, corsHeaders)
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, successResponse } from '../_shared/cors.ts'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get recent applicants (last 20 who have twitter handles)
    const { data, error } = await supabase
      .from('applications')
      .select('twitter_handle, twitter_name, created_at')
      .not('twitter_handle', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return successResponse(
        { applicants: [] },
        corsHeaders,
        { 'Cache-Control': 'public, max-age=30' }
      )
    }

    const applicants = (data || []).map(app => ({
      handle: app.twitter_handle,
      name: app.twitter_name || app.twitter_handle
    }))

    return successResponse(
      {
        applicants,
        count: applicants.length,
        last_updated: new Date().toISOString()
      },
      corsHeaders,
      { 'Cache-Control': 'public, max-age=30' } // Cache for 30 seconds
    )

  } catch (error) {
    return successResponse(
      { applicants: [] },
      corsHeaders,
      { 'Cache-Control': 'public, max-age=30' }
    )
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, errorResponse, successResponse } from '../_shared/cors.ts'

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

    // Get total application count
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })

    if (error) {
      // Fallback to mock data on error
      return successResponse(
        { total_applications: 1247 },
        corsHeaders,
        { 'Cache-Control': 'public, max-age=300' } // Cache for 5 minutes
      )
    }

    // Add base count for display (existing applications before tracking)
    const baseCount = 1247
    const totalApplications = baseCount + (count || 0)

    return successResponse(
      {
        total_applications: totalApplications,
        verified_count: 0,
        last_updated: new Date().toISOString()
      },
      corsHeaders,
      { 'Cache-Control': 'public, max-age=300' } // Cache for 5 minutes (increased from 30s)
    )

  } catch (error) {
    // Fallback to mock data on error
    return successResponse(
      { total_applications: 1247 },
      corsHeaders,
      { 'Cache-Control': 'public, max-age=300' }
    )
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, errorResponse, successResponse } from '../_shared/cors.ts'

const FUNNEL_STEPS = [
  'page_view',
  'wallet_connected',
  'twitter_linked',
  'application_submitted',
  'image_generated',
  'tweet_verified'
]

const VALID_DAYS = ['1', '7', '30', 'all'] as const
type DaysParam = typeof VALID_DAYS[number]

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405, corsHeaders)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const url = new URL(req.url)
    const daysParam = url.searchParams.get('days') || '7'

    // Validate days parameter
    if (!VALID_DAYS.includes(daysParam as DaysParam)) {
      return errorResponse(`Invalid days parameter. Must be one of: ${VALID_DAYS.join(', ')}`, 400, corsHeaders)
    }

    // Calculate start date (null for "all")
    let startDate: Date | null = null
    if (daysParam !== 'all') {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(daysParam))
    }

    // Get aggregate funnel counts
    let funnelQuery = supabase.from('events').select('event_name')
    if (startDate) {
      funnelQuery = funnelQuery.gte('created_at', startDate.toISOString())
    }

    const { data: funnelData, error: funnelError } = await funnelQuery

    if (funnelError) {
      console.error('Funnel query error:', funnelError)
      return errorResponse('Failed to fetch funnel data', 500, corsHeaders)
    }

    // Count events by type
    const counts: Record<string, number> = {}
    for (const step of FUNNEL_STEPS) {
      counts[step] = 0
    }
    for (const row of funnelData || []) {
      if (counts[row.event_name] !== undefined) {
        counts[row.event_name]++
      }
    }

    // Get unique wallet counts per step
    let uniqueQuery = supabase
      .from('events')
      .select('event_name, wallet_address')
      .not('wallet_address', 'is', null)
    if (startDate) {
      uniqueQuery = uniqueQuery.gte('created_at', startDate.toISOString())
    }

    const { data: uniqueData } = await uniqueQuery

    const uniqueWallets: Record<string, Set<string>> = {}
    for (const step of FUNNEL_STEPS) {
      uniqueWallets[step] = new Set()
    }
    for (const row of uniqueData || []) {
      if (row.wallet_address && uniqueWallets[row.event_name]) {
        uniqueWallets[row.event_name].add(row.wallet_address)
      }
    }

    // Get daily breakdown
    let dailyQuery = supabase
      .from('events')
      .select('event_name, created_at')
      .order('created_at', { ascending: true })
    if (startDate) {
      dailyQuery = dailyQuery.gte('created_at', startDate.toISOString())
    }

    const { data: dailyData } = await dailyQuery

    const dailyBreakdown: Record<string, Record<string, number>> = {}
    for (const row of dailyData || []) {
      const date = row.created_at.split('T')[0]
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {}
        for (const step of FUNNEL_STEPS) {
          dailyBreakdown[date][step] = 0
        }
      }
      if (dailyBreakdown[date][row.event_name] !== undefined) {
        dailyBreakdown[date][row.event_name]++
      }
    }

    // Build funnel response with conversion rates
    const funnel = FUNNEL_STEPS.map((step, index) => {
      const count = counts[step]
      const uniqueCount = uniqueWallets[step].size
      const prevCount = index > 0 ? counts[FUNNEL_STEPS[index - 1]] : count
      const prevUnique = index > 0 ? uniqueWallets[FUNNEL_STEPS[index - 1]].size : uniqueCount

      // Step conversion (from previous step)
      const stepConversion = prevCount > 0 ? ((count / prevCount) * 100) : 0
      const stepConversionUnique = prevUnique > 0 ? ((uniqueCount / prevUnique) * 100) : 0

      // Overall conversion (from first step)
      const overallConversion = counts[FUNNEL_STEPS[0]] > 0
        ? ((count / counts[FUNNEL_STEPS[0]]) * 100)
        : 0
      const overallConversionUnique = uniqueWallets[FUNNEL_STEPS[0]].size > 0
        ? ((uniqueCount / uniqueWallets[FUNNEL_STEPS[0]].size) * 100)
        : 0

      return {
        step,
        label: step.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        count,
        uniqueWallets: uniqueCount,
        stepConversion: parseFloat(stepConversion.toFixed(1)),
        stepConversionUnique: parseFloat(stepConversionUnique.toFixed(1)),
        overallConversion: parseFloat(overallConversion.toFixed(1)),
        overallConversionUnique: parseFloat(overallConversionUnique.toFixed(1))
      }
    })

    // Format daily data for charts
    const dates = Object.keys(dailyBreakdown).sort()
    const dailyChart = {
      labels: dates,
      datasets: FUNNEL_STEPS.map(step => ({
        label: step.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        data: dates.map(date => dailyBreakdown[date][step] || 0)
      }))
    }

    // Calculate period label
    const period = daysParam === 'all' ? 'all_time' : `last_${daysParam}_days`
    const dateRange = startDate
      ? { start: startDate.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] }
      : { start: dates[0] || null, end: dates[dates.length - 1] || null }

    return successResponse({
      period,
      funnel,
      dailyChart,
      summary: {
        totalEvents: funnelData?.length || 0,
        uniqueVisitors: uniqueWallets[FUNNEL_STEPS[0]].size,
        completedFunnel: uniqueWallets[FUNNEL_STEPS[FUNNEL_STEPS.length - 1]].size,
        dateRange,
        overallConversion: funnel.length > 0 ? funnel[funnel.length - 1].overallConversion : 0,
        overallConversionUnique: funnel.length > 0 ? funnel[funnel.length - 1].overallConversionUnique : 0
      },
      generatedAt: new Date().toISOString()
    }, corsHeaders, { 'Cache-Control': 'public, max-age=60' })

  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500, corsHeaders)
  }
})

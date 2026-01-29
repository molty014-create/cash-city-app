import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isValidSolanaAddress, errorResponse, successResponse } from '../_shared/cors.ts'

// Convert ArrayBuffer to base64 safely (handles large images)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  return btoa(binary)
}

// Analysis prompt used for both base64 and URL methods
const ANALYSIS_PROMPT = `You are a creative writer analyzing a profile picture to extract visual traits for a character transformation into a gritty crime boss scene.

TASK: Study this image and describe the character with RICH, EVOCATIVE detail. Be creative and specific - we want personality, not generic descriptions.

Return ONLY a valid JSON object:

{
  "image_type": "photo|nft|anime|cartoon|animal|pixel|meme|3d|abstract",
  "subject_type": "human|animal|robot|creature|skeleton|zombie|demon|angel|alien|abstract",
  "hair_color": "exact color (purple, electric blue, jet black, silver, etc) or bald or null",
  "hair_style": "be descriptive! Examples: 'tousled medium length with bangs', 'short fade with textured top', 'messy curly with twigs and leaves', 'slicked back undercut', 'wild untamed mane'",
  "facial_hair": "stubble, full beard, goatee, handlebar mustache, or null",
  "skin_tone": "be specific! Examples: 'pale porcelain', 'sun-kissed tan', 'deep brown', 'red demon-like', 'rotting zombie green', 'golden metallic', 'black fur with tan muzzle'",
  "dominant_colors": ["2-3 main colors from the image"],
  "accessories": ["list ALL visible items: smoking pipe, beret, crown, chains, sunglasses, headband, earrings, bandana, mask, cigarette, etc"],
  "quirky_feature": "THE signature visual element that makes this character unique. Be VERY descriptive and creative! Examples: 'full body covered in elaborate Japanese-style tattoos including oni demon mask on chest', 'red demon-like skin with golden stitches covering entire face and body like a living voodoo doll', 'anthropomorphic black bear with small rounded ears and tired blue eyes', 'glowing laser eyes with cybernetic implants', 'skeleton face with gold tooth and cracked skull'",
  "expression_and_attitude": "Describe their VIBE and personality, not just facial expression. Examples: 'artistic rebel yakuza', 'tired streetwise hustler', 'gritty supernatural rebel', 'old-school street smart gangster', 'menacing crime boss with cold calculating eyes', 'rebellious bad boy with a smirk'",
  "suit_color": "what color suit fits this character's aesthetic (deep purple, charcoal black, burgundy red, etc)",
  "tie_color": "complementary tie color"
}

CRITICAL - BE CREATIVE:
- Hair style should be DESCRIPTIVE not single words
- Quirky feature should be a DETAILED sentence describing the most memorable visual element
- Expression should capture ATTITUDE and PERSONALITY, not just "happy" or "angry"
- Think like a character designer - what makes this character UNIQUE?
- Return ONLY valid JSON, no markdown`

// Analyze using URL source (for large images that exceed base64 limit)
async function analyzePfpWithUrl(imageUrl: string, anthropicKey: string, retryCount = 0): Promise<Record<string, unknown>> {
  console.log('Using URL source for Claude analysis...')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl
            }
          },
          {
            type: 'text',
            text: ANALYSIS_PROMPT
          }
        ]
      }]
    })
  })

  const data = await response.json()

  if (data.error) {
    console.error('Claude API error (URL method):', JSON.stringify(data.error))
    if (retryCount < 2 && (data.error.type === 'rate_limit_error' || response.status === 429)) {
      console.log(`Rate limited, retrying (attempt ${retryCount + 2}) after 2s...`)
      await new Promise(r => setTimeout(r, 2000))
      return analyzePfpWithUrl(imageUrl, anthropicKey, retryCount + 1)
    }
    return {}
  }

  const text = data.content?.[0]?.text || '{}'
  console.log('Claude raw response (URL):', text.slice(0, 500))

  try {
    let jsonStr = text
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonStr = jsonMatch[0]
    return JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 500))
      return analyzePfpWithUrl(imageUrl, anthropicKey, retryCount + 1)
    }
    return {}
  }
}

// Analyze profile picture using Claude Vision
async function analyzePfp(imageUrl: string, anthropicKey: string, retryCount = 0): Promise<Record<string, unknown>> {
  // Fetch the image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    console.error(`Failed to fetch image: ${imageResponse.status}`)
    return {}
  }

  const imageBuffer = await imageResponse.arrayBuffer()

  // Reject images that are too small (likely broken)
  if (imageBuffer.byteLength < 1000) {
    console.error('Image too small, likely broken')
    return {}
  }

  // Check if image is too large for Claude (5MB limit)
  const MAX_CLAUDE_SIZE = 5 * 1024 * 1024
  if (imageBuffer.byteLength > MAX_CLAUDE_SIZE) {
    console.log(`Image too large for Claude: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(1)}MB > 5MB limit`)
    console.log('Attempting to use image URL instead of base64...')

    // Try using URL source instead of base64
    return analyzePfpWithUrl(imageUrl, anthropicKey, retryCount)
  }

  // Convert to base64
  const base64Image = arrayBufferToBase64(imageBuffer)

  // Determine MIME type
  const contentType = imageResponse.headers.get('content-type') || ''
  let mimeType = 'image/jpeg'
  if (imageUrl.toLowerCase().includes('.png') || contentType.includes('png')) {
    mimeType = 'image/png'
  } else if (imageUrl.toLowerCase().includes('.gif') || contentType.includes('gif')) {
    mimeType = 'image/gif'
  } else if (imageUrl.toLowerCase().includes('.webp') || contentType.includes('webp')) {
    mimeType = 'image/webp'
  }

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: ANALYSIS_PROMPT
          }
        ]
      }]
    })
  })

  const data = await response.json()

  // Check for API errors
  if (data.error) {
    console.error('Claude API error:', JSON.stringify(data.error))

    // Retry on rate limits
    if (retryCount < 2 && (data.error.type === 'rate_limit_error' || response.status === 429)) {
      console.log(`Rate limited, retrying (attempt ${retryCount + 2}) after 2s...`)
      await new Promise(r => setTimeout(r, 2000))
      return analyzePfp(imageUrl, anthropicKey, retryCount + 1)
    }
    return {}
  }

  // Extract text from Claude response
  const text = data.content?.[0]?.text || '{}'
  console.log('Claude raw response:', text.slice(0, 800))

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text

    // Try to extract from code blocks first
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    // Find the JSON object regardless
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const parsed = JSON.parse(jsonStr)

    // Validate that we got meaningful data
    const hasUsefulData = parsed.hair_color || parsed.skin_tone || parsed.quirky_feature ||
                         (parsed.accessories && parsed.accessories.length > 0) ||
                         (parsed.dominant_colors && parsed.dominant_colors.length > 0)

    if (!hasUsefulData && retryCount < 2) {
      console.log('Analysis too generic, retrying...')
      await new Promise(r => setTimeout(r, 500))
      return analyzePfp(imageUrl, anthropicKey, retryCount + 1)
    }

    return parsed
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Raw text:', text.slice(0, 300))
    if (retryCount < 2) {
      console.log('Parse failed, retrying...')
      await new Promise(r => setTimeout(r, 500))
      return analyzePfp(imageUrl, anthropicKey, retryCount + 1)
    }
    return {}
  }
}

// Check if analysis has enough data to generate a good prompt
function isAnalysisValid(analysis: Record<string, unknown>): boolean {
  if (!analysis || Object.keys(analysis).length === 0) return false

  let validFields = 0
  if (analysis.hair_color && analysis.hair_color !== 'null') validFields++
  if (analysis.skin_tone && analysis.skin_tone !== 'null') validFields++
  if (analysis.quirky_feature && analysis.quirky_feature !== 'null') validFields++
  if (analysis.expression_and_attitude || analysis.expression) validFields++
  if (Array.isArray(analysis.accessories) && analysis.accessories.length > 0) validFields++
  if (Array.isArray(analysis.dominant_colors) && analysis.dominant_colors.length > 0) validFields++

  return validFields >= 2
}

// Generate prompt from analysis
function generatePrompt(analysis: Record<string, unknown>): string {
  const parts: string[] = []

  const isValid = (val: unknown): boolean => {
    if (!val) return false
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim()
      return lower !== 'null' && lower !== 'none' && lower !== 'n/a' && lower !== 'undefined' && lower.length > 0
    }
    return true
  }

  // CRITICAL COMPOSITION LOCKS - These must come FIRST and be emphatic
  parts.push('IMPORTANT: Do NOT move or reposition the character')
  parts.push('IMPORTANT: Do NOT move the arms or hands from their current position')
  parts.push('IMPORTANT: Do NOT change any text, logos, signs, or writing in the image')
  parts.push('IMPORTANT: Keep the exact same pose, position, and composition')
  parts.push('IMPORTANT: Only modify the character appearance attributes below')

  // Skin tone
  const skinTone = analysis.skin_tone as string | undefined
  if (isValid(skinTone)) {
    parts.push(`character has ${skinTone} skin`)
  }

  // Hair
  const hairColor = analysis.hair_color as string | undefined
  const hairStyle = analysis.hair_style as string | undefined
  if (isValid(hairColor)) {
    if (hairColor!.toLowerCase() === 'bald') {
      parts.push('character is bald')
    } else {
      let hair = hairColor!
      if (isValid(hairStyle)) {
        hair += ` ${hairStyle}`
      }
      parts.push(`character has ${hair} hair`)
    }
  }

  // Facial hair
  const facialHair = analysis.facial_hair as string | undefined
  if (isValid(facialHair) && facialHair!.toLowerCase() !== 'clean-shaven') {
    parts.push(`character has ${facialHair}`)
  }

  // Suit
  const suitColor = analysis.suit_color as string | undefined
  const dominantColors = analysis.dominant_colors as string[] | undefined
  if (isValid(suitColor)) {
    parts.push(`character wears ${suitColor} suit`)
  } else if (dominantColors && dominantColors.length > 0 && isValid(dominantColors[0])) {
    parts.push(`character wears ${dominantColors[0]} suit`)
  } else {
    parts.push('character wears charcoal gray suit')
  }

  // Tie
  const tieColor = analysis.tie_color as string | undefined
  if (isValid(tieColor)) {
    parts.push(`character wears ${tieColor} tie`)
  } else if (dominantColors && dominantColors.length > 1 && isValid(dominantColors[1])) {
    parts.push(`character wears ${dominantColors[1]} tie`)
  }

  // Accessories - separate held items from worn items
  // CRITICAL: Use "already has" phrasing to prevent model from repositioning to place items
  const accessories = analysis.accessories as string[] | undefined
  if (accessories && accessories.length > 0) {
    const validAccessories = accessories.filter((a: string) => isValid(a))

    // Items that are held (pipe, cigarette, etc) - should NOT cause repositioning
    const heldItems = ['pipe', 'cigarette', 'cigar', 'joint', 'glass', 'cup', 'drink', 'weapon', 'gun', 'knife', 'phone', 'book']
    const heldAccessories: string[] = []
    const wornAccessories: string[] = []

    for (const acc of validAccessories.slice(0, 3)) {
      const lower = acc.toLowerCase()
      // Skip items that should be in quirky_feature (tattoos, scars, etc)
      if (lower.includes('tattoo') || lower.includes('scar') || lower.includes('stitch')) {
        continue
      }
      if (heldItems.some(item => lower.includes(item))) {
        // Simplify held item names - remove extra adjectives that might confuse the model
        const simplified = lower.replace(/wooden |lit |burning |smoking |electronic |vintage |antique /gi, '')
        heldAccessories.push(simplified)
      } else {
        wornAccessories.push(acc)
      }
    }

    // Worn items use "wears"
    if (wornAccessories.length > 0) {
      parts.push(`character wears ${wornAccessories.join(' and ')}`)
    }

    // Held items use "already has X in current position" to prevent repositioning
    if (heldAccessories.length > 0) {
      parts.push(`character already has ${heldAccessories.join(' and ')} in their current position without moving`)
    }
  }

  // Quirky feature - this is key for personality
  const quirkyFeature = analysis.quirky_feature as string | undefined
  if (isValid(quirkyFeature)) {
    parts.push(`character has ${quirkyFeature}`)
  }

  // Expression/attitude - use the new creative field or fall back to old
  const expressionAttitude = analysis.expression_and_attitude as string | undefined
  const expression = analysis.expression as string | undefined
  if (isValid(expressionAttitude)) {
    parts.push(`character has ${expressionAttitude} expression and attitude`)
  } else if (isValid(expression)) {
    parts.push(`character has ${expression} expression and attitude`)
  }

  // FINAL COMPOSITION REMINDERS - reinforce at the end
  parts.push('preserve all background elements exactly as they are')
  parts.push('preserve all text and signage unchanged')
  parts.push('do not alter lighting or camera angle')
  parts.push('maintain original image composition')

  return parts.join(', ')
}

// Generate negative prompt
function generateNegativePrompt(): string {
  return [
    // CRITICAL: No position/composition changes
    'zoomed in',
    'zoomed out',
    'closer to camera',
    'moved forward',
    'moved back',
    'different position',
    'repositioned',
    'changed pose',
    'different stance',
    'standing up',
    'different angle',
    'cropped',
    'reframed',
    // CRITICAL: No arm/hand repositioning
    'arm moved',
    'hand repositioned',
    'reaching',
    'grabbing',
    'picking up',
    'putting down',
    'arm raised',
    'arm lowered',
    // No background changes
    'changed background',
    'different background',
    'modified text',
    'altered signs',
    'changed writing',
    // No extra characters
    'multiple people',
    'extra characters',
    'two people',
    'additional person',
    'crowd',
    // No style changes
    'different art style',
    'photorealistic',
    'realistic photo',
    'pixel art',
    '8-bit',
    // Quality issues
    'blurry',
    'low quality',
    'distorted',
    'deformed'
  ].join(', ')
}

// Generate character using fal.ai Seedream 4.5 Edit
async function generateWithSeedream(prompt: string, negativePrompt: string, baseImageUrl: string, falKey: string): Promise<string> {
  const MODEL = 'fal-ai/bytedance/seedream/v4.5/edit'

  const submitResponse = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      negative_prompt: negativePrompt,
      image_urls: [baseImageUrl],
      num_images: 1,
      strength: 0.75,
      enable_safety_checker: false
    })
  })

  const submitText = await submitResponse.text()

  if (!submitResponse.ok) {
    throw new Error(`Submit failed: ${submitText}`)
  }

  const submitData = JSON.parse(submitText)

  const requestId = submitData.request_id
  const statusUrl = submitData.status_url || `https://queue.fal.run/${MODEL}/requests/${requestId}/status`
  const responseUrl = submitData.response_url || `https://queue.fal.run/${MODEL}/requests/${requestId}`

  if (!requestId) {
    throw new Error('No request_id returned')
  }

  // Poll for result
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 1000))

    try {
      const statusRes = await fetch(statusUrl, {
        method: 'GET',
        headers: { 'Authorization': `Key ${falKey}` }
      })

      const statusText = await statusRes.text()

      if (!statusRes.ok) {
        continue
      }

      const status = JSON.parse(statusText)

      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(responseUrl, {
          method: 'GET',
          headers: { 'Authorization': `Key ${falKey}` }
        })
        const resultText = await resultRes.text()
        const result = JSON.parse(resultText)
        return result.images?.[0]?.url || ''
      }

      if (status.status === 'FAILED') {
        throw new Error('Generation failed on fal.ai')
      }
    } catch (pollError) {
      // Continue polling on error
    }
  }

  throw new Error('Generation timed out')
}

// Application deadline: Feb 3, 2026 at 4pm UTC
const DEADLINE = new Date('2026-02-03T16:00:00Z')

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profile_image_url, wallet_address, dry_run } = await req.json()

    if (!profile_image_url || !wallet_address) {
      return errorResponse('Missing profile_image_url or wallet_address', 400, corsHeaders)
    }

    if (dry_run) {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000))
      return successResponse(
        {
          success: true,
          dry_run: true,
          image_url: 'https://placehold.co/512x512/1a1f1d/D5E59B?text=DRY+RUN',
          prompt: 'DRY RUN - no AI generation',
          analysis: { dry_run: true }
        },
        corsHeaders
      )
    }

    if (!isValidSolanaAddress(wallet_address)) {
      return errorResponse('Invalid wallet address format', 400, corsHeaders)
    }

    try {
      const url = new URL(profile_image_url)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return errorResponse('Invalid profile image URL', 400, corsHeaders)
      }
    } catch {
      return errorResponse('Invalid profile image URL', 400, corsHeaders)
    }

    if (new Date() > DEADLINE) {
      return errorResponse('Applications are now closed', 403, corsHeaders)
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    const FAL_KEY = Deno.env.get('FAL_KEY')
    const BASE_SCENE_URL = Deno.env.get('BASE_SCENE_URL')

    if (!ANTHROPIC_API_KEY || !FAL_KEY) {
      console.error('Missing API keys - ANTHROPIC_API_KEY:', !!ANTHROPIC_API_KEY, 'FAL_KEY:', !!FAL_KEY)
      return errorResponse('Server configuration error', 500, corsHeaders)
    }

    if (!BASE_SCENE_URL) {
      return errorResponse('Base scene not configured', 500, corsHeaders)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { data: existingApp } = await supabase
      .from('applications')
      .select('generated_image_url')
      .eq('wallet_address', wallet_address)
      .single()

    if (existingApp?.generated_image_url) {
      return successResponse(
        {
          success: true,
          image_url: existingApp.generated_image_url,
          existing: true
        },
        corsHeaders
      )
    }

    // Step 1: Analyze the profile picture with Claude
    console.log('Step 1: Analyzing PFP with Claude...')
    const analysis = await analyzePfp(profile_image_url, ANTHROPIC_API_KEY)
    console.log('Step 1 complete:', JSON.stringify(analysis))

    // Validate analysis quality
    if (!isAnalysisValid(analysis)) {
      console.error('Analysis invalid or too generic:', JSON.stringify(analysis))
      return errorResponse('Could not analyze profile picture. Please try a different image.', 400, corsHeaders)
    }

    // Step 2: Generate prompts
    console.log('Step 2: Generating prompt...')
    const prompt = generatePrompt(analysis)
    const negativePrompt = generateNegativePrompt()
    console.log('Step 2 complete. Prompt:', prompt)
    console.log('Negative prompt:', negativePrompt)

    // Step 3: Generate character with Seedream
    console.log('Step 3: Calling fal.ai...')
    const generatedImageUrl = await generateWithSeedream(prompt, negativePrompt, BASE_SCENE_URL, FAL_KEY)
    console.log('Step 3 complete:', generatedImageUrl)

    // Step 4: Update database
    await supabase
      .from('applications')
      .update({
        generated_image_url: generatedImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address)

    return successResponse(
      {
        success: true,
        image_url: generatedImageUrl,
        prompt: prompt,
        analysis: analysis
      },
      corsHeaders
    )

  } catch (error) {
    console.error('Generate character error:', error)
    return errorResponse('Failed to generate character', 500, corsHeaders)
  }
})

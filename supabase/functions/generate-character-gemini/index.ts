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

// Analysis prompt - Extract rich identity traits for reskinning the base CEO
// We do NOT care about the art style - only the CHARACTER'S identity and personality
const ANALYSIS_PROMPT = `You are extracting CHARACTER IDENTITY from a profile picture to create a unique trading firm CEO.

TASK: Extract visual traits that make this character UNIQUE and MEMORABLE. Ignore how it's drawn - focus on WHO this character is.

Return ONLY a valid JSON object:

{
  "suit_color": "a rich, specific suit color (e.g. 'deep burgundy', 'midnight navy', 'charcoal gray', 'forest green')",
  "tie_color": "a complementary tie color",
  "pocket_square": "describe a pocket square color/pattern that fits, or null",
  "hat_or_headwear": "any hat, cap, beanie, snapback, bucket hat, crown, headband - be specific about color/style, or null",
  "eyewear": "any glasses or sunglasses - be specific (e.g. 'gold aviator sunglasses', 'black wayfarers', 'round gold spectacles'), or null",
  "facial_hair": "be specific: 'thick black beard', 'gray stubble', 'pencil mustache', 'soul patch', or null",
  "hair": "HUMAN hair only: 'slicked back black hair', 'messy brown curls', 'silver buzzcut', 'bald'. For animals, suggest hair that fits their vibe, NOT fur/mane",
  "skin_tone": "for humans: describe their skin tone. For non-humans: pick a natural human skin tone that matches their vibe",
  "jewelry": "any visible jewelry: gold chain, diamond earring, watch, rings - or null",
  "facial_scar": "if they have any cool scars or distinctive facial marks, describe them, or null",
  "expression": "be specific: 'confident smirk', 'intense glare', 'relaxed smile', 'stone-faced', 'raised eyebrow'",
  "personality": "3-5 words capturing their energy: 'old money sophistication', 'street-smart hustler', 'intimidating presence', 'charismatic charmer'"
}

RULES:
- For animals/robots: still extract colors and accessories, give them a fitting human skin tone
- Be SPECIFIC and DESCRIPTIVE - generic answers make boring characters
- Ignore art style completely (pixel, cartoon, 3D doesn't matter)
- Return ONLY valid JSON, no markdown`

// Analyze profile picture using Gemini Vision
async function analyzePfpWithGemini(imageUrl: string, geminiKey: string, retryCount = 0): Promise<Record<string, unknown>> {
  console.log('Analyzing with Gemini 2.0 Flash (v2 prompt)...')

  // Fetch the image first
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    console.error(`Failed to fetch image: ${imageResponse.status}`)
    return {}
  }

  const imageBuffer = await imageResponse.arrayBuffer()
  if (imageBuffer.byteLength < 1000) {
    console.error('Image too small, likely broken')
    return {}
  }

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

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    }
  )

  const data = await response.json()

  // Check for API errors
  if (data.error) {
    console.error('Gemini API error:', JSON.stringify(data.error))
    if (retryCount < 2 && (data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED')) {
      console.log(`Rate limited, retrying (attempt ${retryCount + 2}) after 2s...`)
      await new Promise(r => setTimeout(r, 2000))
      return analyzePfpWithGemini(imageUrl, geminiKey, retryCount + 1)
    }
    return {}
  }

  // Extract text from Gemini response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  console.log('Gemini raw response:', text.slice(0, 800))

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
    const hasUsefulData = parsed.hair_color || parsed.skin_tone || parsed.facial_features ||
                         parsed.body_features || parsed.expression_vibe ||
                         (parsed.worn_accessories && parsed.worn_accessories.length > 0) ||
                         (parsed.dominant_colors && parsed.dominant_colors.length > 0)

    if (!hasUsefulData && retryCount < 2) {
      console.log('Analysis too generic, retrying...')
      await new Promise(r => setTimeout(r, 500))
      return analyzePfpWithGemini(imageUrl, geminiKey, retryCount + 1)
    }

    return parsed
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Raw text:', text.slice(0, 300))
    if (retryCount < 2) {
      console.log('Parse failed, retrying...')
      await new Promise(r => setTimeout(r, 500))
      return analyzePfpWithGemini(imageUrl, geminiKey, retryCount + 1)
    }
    return {}
  }
}

// Check if analysis has enough data to generate a good prompt
function isAnalysisValid(analysis: Record<string, unknown>): boolean {
  if (!analysis || Object.keys(analysis).length === 0) return false

  // We just need a suit color at minimum to customize
  let validFields = 0
  if (analysis.suit_color && analysis.suit_color !== 'null') validFields++
  if (analysis.tie_color && analysis.tie_color !== 'null') validFields++
  if (analysis.hat_or_headwear && analysis.hat_or_headwear !== 'null') validFields++
  if (analysis.eyewear && analysis.eyewear !== 'null') validFields++
  if (analysis.expression && analysis.expression !== 'null') validFields++
  if (analysis.personality && analysis.personality !== 'null') validFields++
  if (analysis.hair && analysis.hair !== 'null') validFields++
  if (analysis.jewelry && analysis.jewelry !== 'null') validFields++

  return validFields >= 1
}

// Generate prompt to RESKIN the base CEO with rich identity traits
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

  // Helper to filter animal terms
  const sanitize = (str: string): string => {
    if (!str) return str
    const badTerms = ['fur', 'furry', 'feather', 'scale', 'snout', 'muzzle', 'paw', 'claw', 'tail', 'wing']
    let result = str
    for (const term of badTerms) {
      result = result.replace(new RegExp(term + '\\w*', 'gi'), '').trim()
    }
    return result
  }

  // Start with the base
  parts.push('edit the trading firm CEO in the image')

  // SUIT
  const suitColor = analysis.suit_color as string | undefined
  if (isValid(suitColor)) {
    parts.push(`wearing a ${suitColor} tailored suit`)
  }

  // TIE
  const tieColor = analysis.tie_color as string | undefined
  if (isValid(tieColor)) {
    parts.push(`with a ${tieColor} silk tie`)
  }

  // POCKET SQUARE
  const pocketSquare = analysis.pocket_square as string | undefined
  if (isValid(pocketSquare)) {
    parts.push(`${pocketSquare} pocket square`)
  }

  // SKIN TONE
  const skinTone = analysis.skin_tone as string | undefined
  if (isValid(skinTone)) {
    const cleanSkin = sanitize(skinTone!)
    if (cleanSkin.length > 2) {
      parts.push(`he has ${cleanSkin} skin`)
    }
  }

  // HAIR - filter out animal-related terms
  const hair = analysis.hair as string | undefined
  if (isValid(hair)) {
    const hairLower = hair!.toLowerCase()
    const isAnimalHair = hairLower.includes('fur') || hairLower.includes('feather') ||
                         hairLower.includes('scale') || hairLower.includes('mane') ||
                         hairLower.includes('coat') || hairLower.includes('pelt')
    if (!isAnimalHair && (hairLower.includes('hair') || hairLower.includes('bald') || hairLower.includes('shaved'))) {
      parts.push(`with ${hair}`)
    }
  }

  // FACIAL HAIR
  const facialHair = analysis.facial_hair as string | undefined
  if (isValid(facialHair)) {
    parts.push(`${facialHair}`)
  }

  // HEADWEAR
  const headwear = analysis.hat_or_headwear as string | undefined
  if (isValid(headwear)) {
    parts.push(`wearing ${headwear}`)
  }

  // EYEWEAR
  const eyewear = analysis.eyewear as string | undefined
  if (isValid(eyewear)) {
    parts.push(`wearing ${eyewear}`)
  }

  // JEWELRY
  const jewelry = analysis.jewelry as string | undefined
  if (isValid(jewelry)) {
    parts.push(`with ${jewelry}`)
  }

  // FACIAL SCAR
  const scar = analysis.facial_scar as string | undefined
  if (isValid(scar)) {
    parts.push(`has ${scar}`)
  }

  // EXPRESSION - this adds a lot of personality
  const expression = analysis.expression as string | undefined
  if (isValid(expression)) {
    parts.push(`with a ${expression}`)
  }

  // PERSONALITY/VIBE - use as overall descriptor
  const personality = analysis.personality as string | undefined
  if (isValid(personality)) {
    parts.push(`exuding ${personality}`)
  }

  // CRITICAL: Preserve composition
  parts.push('keep him as a human male')
  parts.push('MUST maintain exact same camera distance and framing')
  parts.push('keep exact same pose and body position')
  parts.push('do not zoom in or change camera angle')
  parts.push('preserve the background unchanged')
  parts.push('high quality rendering')

  return parts.join(', ')
}

// Negative prompt - prevent common generation issues
function generateNegativePrompt(): string {
  return [
    // Quality
    'blurry', 'low quality', 'distorted', 'deformed', 'ugly',
    'bad anatomy', 'extra limbs', 'deformed hands', 'deformed face',
    // No animals
    'animal', 'fur', 'snout', 'muzzle', 'whiskers', 'paws',
    // No females
    'female', 'woman', 'girl', 'feminine',
    // No gore
    'blood', 'wound', 'gore',
    // CRITICAL: Preserve composition
    'zoomed in', 'close up', 'cropped', 'different framing',
    'different camera angle', 'different pose', 'moved position',
    'different background', 'changed composition'
  ].join(', ')
}

// Generate character using Replicate Seedream 4.5
async function generateWithReplicate(prompt: string, negativePrompt: string, baseImageUrl: string, replicateToken: string, strength = 0.75, retryCount = 0): Promise<string> {
  // Create prediction with retry logic for rate limiting
  const createResponse = await fetch('https://api.replicate.com/v1/models/bytedance/seedream-4.5/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${replicateToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: {
        prompt: prompt,
        negative_prompt: negativePrompt,
        image_input: [baseImageUrl],
        strength: strength,
        size: '2K'
      }
    })
  })

  const createText = await createResponse.text()

  // Handle rate limiting with retry
  if (createResponse.status === 429 && retryCount < 3) {
    const retryAfter = parseInt(createResponse.headers.get('retry-after') || '5', 10)
    console.log(`Rate limited, retrying after ${retryAfter}s (attempt ${retryCount + 1}/3)`)
    await new Promise(r => setTimeout(r, (retryAfter + 1) * 1000))
    return generateWithReplicate(prompt, negativePrompt, baseImageUrl, replicateToken, strength, retryCount + 1)
  }

  if (!createResponse.ok) {
    throw new Error(`Replicate create failed: ${createText}`)
  }

  const prediction = JSON.parse(createText)
  const predictionUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`

  if (!prediction.id) {
    throw new Error('No prediction ID returned')
  }

  console.log(`Replicate prediction started: ${prediction.id}`)

  // Poll for result
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 1000))

    try {
      const statusRes = await fetch(predictionUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${replicateToken}` }
      })

      if (!statusRes.ok) {
        continue
      }

      const status = await statusRes.json()

      if (status.status === 'succeeded') {
        // Output is an array of image URLs
        const output = status.output
        if (Array.isArray(output) && output.length > 0) {
          return output[0]
        }
        throw new Error('No output image in response')
      }

      if (status.status === 'failed') {
        throw new Error(`Replicate generation failed: ${status.error || 'Unknown error'}`)
      }

      if (status.status === 'canceled') {
        throw new Error('Replicate generation was canceled')
      }
    } catch (pollError) {
      if (pollError instanceof Error && pollError.message.includes('Replicate')) {
        throw pollError
      }
      // Continue polling on network errors
    }
  }

  throw new Error('Replicate generation timed out')
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
          image_url: 'https://placehold.co/512x512/1a1f1d/4285F4?text=GEMINI+V2+DRY+RUN',
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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')
    const BASE_SCENE_URL = Deno.env.get('BASE_SCENE_URL')

    if (!GEMINI_API_KEY || !REPLICATE_API_TOKEN) {
      console.error('Missing API keys - GEMINI_API_KEY:', !!GEMINI_API_KEY, 'REPLICATE_API_TOKEN:', !!REPLICATE_API_TOKEN)
      return errorResponse('Server configuration error', 500, corsHeaders)
    }

    if (!BASE_SCENE_URL) {
      return errorResponse('Base scene not configured', 500, corsHeaders)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Step 1: Analyze the profile picture with Gemini
    console.log('Step 1: Analyzing PFP with Gemini v2...')
    const analysis = await analyzePfpWithGemini(profile_image_url, GEMINI_API_KEY)
    console.log('Step 1 complete:', JSON.stringify(analysis))

    // Validate analysis quality
    if (!isAnalysisValid(analysis)) {
      console.error('Analysis invalid or too generic:', JSON.stringify(analysis))
      return errorResponse('Could not analyze profile picture. Please try a different image.', 400, corsHeaders)
    }

    // Step 2: Generate prompts
    console.log('Step 2: Generating reskin prompt...')
    const prompt = generatePrompt(analysis)
    const negativePrompt = generateNegativePrompt()
    console.log('Step 2 complete. Prompt:', prompt)

    // Step 3: Generate character with Replicate Seedream 4.5
    // Strength 0.70 allows for good customization while preserving the base character
    console.log('Step 3: Calling Replicate Seedream 4.5 to reskin base character...')
    const generatedImageUrl = await generateWithReplicate(prompt, negativePrompt, BASE_SCENE_URL, REPLICATE_API_TOKEN, 0.70)
    console.log('Step 3 complete:', generatedImageUrl)

    return successResponse(
      {
        success: true,
        image_url: generatedImageUrl,
        prompt: prompt,
        analysis: analysis,
        model: 'gemini-2.0-flash-v2'
      },
      corsHeaders
    )

  } catch (error) {
    console.error('Generate character error:', error)
    return errorResponse('Failed to generate character', 500, corsHeaders)
  }
})

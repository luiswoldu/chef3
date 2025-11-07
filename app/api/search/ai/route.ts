import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getServerSupabase, getRecipesByIngredient } from '@/lib/supabase/server'
import type { Recipe } from '@/types'

export const runtime = 'nodejs'

// Rate limiting store (in-memory, per-process)
const rateLimitStore = new Map<string, {
  count: number
  windowStart: number
  dailyCount: number
  dailyStart: number
  failCount: number
  circuitOpen: boolean
  circuitOpenUntil: number
}>()

const AI_QPS = parseInt(process.env.AI_QPS || '5', 10)
const AI_DAILY_CAP = parseInt(process.env.AI_DAILY_CAP || '20', 10)
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '8000', 10)
const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_WINDOW_MS = 60000 // 60s

interface AISearchResult {
  id: number
  title: string
  reason?: string
}

interface AIResponse {
  results: AISearchResult[]
  fallback?: boolean
}

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown'
  return `ip:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; reason?: string } {
  const now = Date.now()
  const store = rateLimitStore.get(key) || {
    count: 0,
    windowStart: now,
    dailyCount: 0,
    dailyStart: now,
    failCount: 0,
    circuitOpen: false,
    circuitOpenUntil: 0
  }

  // Check circuit breaker
  if (store.circuitOpen) {
    if (now < store.circuitOpenUntil) {
      return { allowed: false, reason: 'circuit_breaker' }
    }
    store.circuitOpen = false
    store.failCount = 0
  }

  // Reset QPS window (1 second)
  if (now - store.windowStart > 1000) {
    store.count = 0
    store.windowStart = now
  }

  // Reset daily window (24 hours)
  if (now - store.dailyStart > 86400000) {
    store.dailyCount = 0
    store.dailyStart = now
  }

  // Check limits
  if (store.count >= AI_QPS) {
    rateLimitStore.set(key, store)
    return { allowed: false, reason: 'qps_exceeded' }
  }

  if (store.dailyCount >= AI_DAILY_CAP) {
    rateLimitStore.set(key, store)
    return { allowed: false, reason: 'daily_cap_exceeded' }
  }

  // Increment counters
  store.count++
  store.dailyCount++
  rateLimitStore.set(key, store)

  return { allowed: true }
}

function recordFailure(key: string) {
  const store = rateLimitStore.get(key)
  if (!store) return

  store.failCount++
  if (store.failCount >= CIRCUIT_BREAKER_THRESHOLD) {
    store.circuitOpen = true
    store.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_WINDOW_MS
    console.warn(`[AI Search] Circuit breaker opened for ${key}`)
  }
  rateLimitStore.set(key, store)
}

function recordSuccess(key: string) {
  const store = rateLimitStore.get(key)
  if (!store) return
  store.failCount = Math.max(0, store.failCount - 1)
  rateLimitStore.set(key, store)
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  // Check if AI search is enabled
  if (process.env.ENABLE_AI_SEARCH !== 'true') {
    return NextResponse.json<AIResponse>({ results: [], fallback: true })
  }

  // Parse and validate body
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { query } = body
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query must be a string' }, { status: 400 })
  }

  if (query.length < 1 || query.length > 120) {
    return NextResponse.json({ error: 'query length must be 1-120 characters' }, { status: 400 })
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(req)
  const rateLimitCheck = checkRateLimit(rateLimitKey)
  if (!rateLimitCheck.allowed) {
    return NextResponse.json<AIResponse>(
      { results: [], fallback: true },
      { status: 429, headers: { 'X-RateLimit-Reason': rateLimitCheck.reason || 'unknown' } }
    )
  }

  try {
    // Call OpenAI with timeout
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are a recipe search assistant. Extract search intent and keywords from user queries. Return ONLY valid JSON: { "intent": "ingredient"|"title"|"mixed", "keywords": ["keyword1", "keyword2"] }. Maximum 8 keywords. No prose.'
      }, {
        role: 'user',
        content: `Query: "${query}"`
      }],
      temperature: 0.1,
      max_tokens: 150
    }, { signal: controller.signal as any })

    clearTimeout(timeout)

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from OpenAI')

    // Parse AI response
    let aiResult: { intent: 'ingredient' | 'title' | 'mixed'; keywords: string[] }
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      aiResult = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error('Invalid JSON from OpenAI')
    }

    // Validate AI response structure
    if (!aiResult.intent || !Array.isArray(aiResult.keywords)) {
      throw new Error('Invalid AI response structure')
    }

    // Limit keywords to 8
    const keywords = aiResult.keywords.slice(0, 8)
    if (keywords.length === 0) {
      return NextResponse.json<AIResponse>({ results: [], fallback: true })
    }

    // Fetch recipes using existing helpers
    const recipesMap = new Map<number, AISearchResult>()
    const supabase = getServerSupabase()

    // Search by ingredients if needed
    if (aiResult.intent === 'ingredient' || aiResult.intent === 'mixed') {
      for (const keyword of keywords) {
        try {
          const recipes = await getRecipesByIngredient(keyword)
          recipes.forEach((recipe: Recipe) => {
            if (!recipesMap.has(recipe.id)) {
              recipesMap.set(recipe.id, {
                id: recipe.id,
                title: recipe.title,
                reason: 'ingredient'
              })
            }
          })
        } catch (err) {
          console.error(`[AI Search] Ingredient search failed for "${keyword}":`, err)
        }
      }
    }

    // Search by title if needed (reuse liveSearch pattern)
    if (aiResult.intent === 'title' || aiResult.intent === 'mixed') {
      for (const keyword of keywords) {
        try {
          const { data } = await supabase
            .from('recipes')
            .select('id, title')
            .ilike('title', `%${keyword}%`)
            .limit(30)

          if (data) {
            data.forEach((recipe: any) => {
              if (!recipesMap.has(recipe.id)) {
                recipesMap.set(recipe.id, {
                  id: recipe.id,
                  title: recipe.title,
                  reason: 'title'
                })
              }
            })
          }
        } catch (err) {
          console.error(`[AI Search] Title search failed for "${keyword}":`, err)
        }
      }
    }

    // Build results (deduped, capped at 30)
    const results: AISearchResult[] = Array.from(recipesMap.values()).slice(0, 30)

    recordSuccess(rateLimitKey)

    // Minimal telemetry (no secrets)
    const latency = Date.now() - startTime
    console.log(`[AI Search] query_len=${query.length} intent=${aiResult.intent} keywords=${keywords.length} results=${results.length} latency=${latency}ms`)

    return NextResponse.json<AIResponse>({ results })

  } catch (error: any) {
    recordFailure(rateLimitKey)
    console.error('[AI Search Error]', error.message)
    
    // Always return safe fallback on any error
    return NextResponse.json<AIResponse>({ results: [], fallback: true })
  }
}

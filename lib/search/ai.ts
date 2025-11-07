interface AISearchResult {
  id: number
  title: string
  reason?: string
}

interface AIResponse {
  results: AISearchResult[]
  fallback?: boolean
}

// Local cooldown tracking to avoid spamming on errors
let cooldownUntil = 0
const COOLDOWN_MS = 5000 // 5 seconds

export async function aiSearch(query: string): Promise<AISearchResult[]> {
  // Check if we're in cooldown
  if (Date.now() < cooldownUntil) {
    return []
  }

  // Validate query length
  if (!query || query.length < 1 || query.length > 120) {
    return []
  }

  try {
    const response = await fetch('/api/search/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000) // 10s client timeout
    })

    // Handle rate limiting or errors
    if (response.status === 429) {
      cooldownUntil = Date.now() + COOLDOWN_MS
      return []
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data: AIResponse = await response.json()

    // If server returned fallback, trigger cooldown
    if (data.fallback) {
      cooldownUntil = Date.now() + COOLDOWN_MS
      return []
    }

    return data.results || []

  } catch (error) {
    console.error('[AI Search Client]', error)
    // On any error, trigger cooldown and return empty
    cooldownUntil = Date.now() + COOLDOWN_MS
    return []
  }
}

// Check if AI search is available (called once on mount)
export async function checkAIAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/config')
    if (!response.ok) return false
    const data = await response.json()
    return data.ai === true
  } catch {
    return false
  }
}

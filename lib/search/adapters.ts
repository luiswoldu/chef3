import { supabase } from '@/lib/supabase/client'
import type { Recipe } from '@/types'
import type {
  SearchAdapter,
  BasicSearchOptions,
  LiveSearchOptions,
  SearchResults,
  LiveSearchResults,
} from './types'
import { RESULTS_PAGE_PATTERN, LIVE_SEARCH_PATTERN } from './constants'

/**
 * Basic ILIKE-based search adapter
 * Preserves current behavior exactly:
 * - Results page: prefix match with user scoping
 * - Live search: contains match without user scoping
 */
class ILikeSearchAdapter implements SearchAdapter {
  /**
   * Basic search (used by results page)
   * Current behavior:
   * - Pattern: `${query}%` (prefix match)
   * - Scoped to user_id
   * - Returns full recipe objects
   * - No pagination/limit
   */
  async search(options: BasicSearchOptions): Promise<SearchResults> {
    const { query, userId, limit, prefixOnly = true } = options

    if (!query.trim()) {
      return { recipes: [], totalCount: 0 }
    }

    try {
      // Build query
      let queryBuilder = supabase
        .from('recipes')
        .select('*', { count: 'exact' })

      // Apply user scoping if provided
      if (userId) {
        queryBuilder = queryBuilder.eq('user_id', userId)
      }

      // Apply search pattern (preserve current behavior: prefix match)
      const pattern = prefixOnly ? `${query}%` : `%${query}%`
      queryBuilder = queryBuilder.ilike('title', pattern)

      // Apply limit if provided (current behavior: no limit)
      if (limit) {
        queryBuilder = queryBuilder.limit(limit)
      }

      const { data, error, count } = await queryBuilder

      if (error) {
        console.error('Search error:', error)
        return { recipes: [], totalCount: 0 }
      }

      return {
        recipes: (data as Recipe[]) || [],
        totalCount: count || 0,
      }
    } catch (error) {
      console.error('Search adapter error:', error)
      return { recipes: [], totalCount: 0 }
    }
  }

  /**
   * Live search (used by SearchView dropdown)
   * Current behavior:
   * - Pattern: `%${query}%` (contains match)
   * - No user scoping (searches all recipes)
   * - Returns only id and title
   * - No explicit limit
   */
  async liveSearch(options: LiveSearchOptions): Promise<LiveSearchResults> {
    const { query, limit } = options

    if (!query.trim()) {
      return { recipes: [], ingredients: [] }
    }

    try {
      // Only search recipes, not ingredients (current behavior)
      let queryBuilder = supabase
        .from('recipes')
        .select('id, title')
        .ilike('title', `%${query}%`) // Contains match

      if (limit) {
        queryBuilder = queryBuilder.limit(limit)
      }

      const { data, error } = await queryBuilder

      if (error) {
        console.error('Live search error:', error)
        return { recipes: [], ingredients: [] }
      }

      return {
        recipes: data || [],
        ingredients: [], // Always empty (current behavior)
      }
    } catch (error) {
      console.error('Live search adapter error:', error)
      return { recipes: [], ingredients: [] }
    }
  }
}

/**
 * Factory function to get the current search adapter
 * For now, always returns the ILIKE adapter (preserves current behavior)
 * Future: Can return different adapters based on config/feature flags
 */
export function getSearchAdapter(): SearchAdapter {
  return new ILikeSearchAdapter()
}

/**
 * Convenience functions for direct use
 */
export async function basicSearch(
  query: string,
  userId?: string,
  limit?: number
): Promise<SearchResults> {
  const adapter = getSearchAdapter()
  return adapter.search({
    query,
    userId,
    limit,
    prefixOnly: RESULTS_PAGE_PATTERN === 'prefix',
  })
}

export async function liveSearch(
  query: string,
  limit?: number
): Promise<LiveSearchResults> {
  const adapter = getSearchAdapter()
  return adapter.liveSearch({ query, limit })
}

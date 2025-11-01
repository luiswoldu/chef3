import type { Recipe } from '@/types'

/**
 * Search result types
 */
export interface SearchResults {
  recipes: Recipe[]
  totalCount: number
}

export interface LiveSearchResults {
  recipes: { id: number; title: string }[]
  ingredients: { id: number; name: string }[]
}

/**
 * Search options for different search methods
 */
export interface BasicSearchOptions {
  query: string
  userId?: string
  limit?: number
  prefixOnly?: boolean // If true, uses `query%`, else `%query%`
}

export interface LiveSearchOptions {
  query: string
  limit?: number
}

/**
 * Search adapter interface - can be implemented by different search strategies
 */
export interface SearchAdapter {
  search(options: BasicSearchOptions): Promise<SearchResults>
  liveSearch(options: LiveSearchOptions): Promise<LiveSearchResults>
}

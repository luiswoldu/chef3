/**
 * Search configuration constants
 */

// Debounce timing for live search (in milliseconds)
export const LIVE_DEBOUNCE_MS = 200

// Default search result limits
export const DEFAULT_SEARCH_LIMIT = 50 // No limit currently applied, but placeholder for future
export const LIVE_SEARCH_LIMIT = 10   // Live search dropdown limit

// Search patterns
export const SEARCH_PATTERN = {
  PREFIX: 'prefix',      // Matches: query%
  CONTAINS: 'contains',  // Matches: %query%
} as const

// Current behavior uses PREFIX for results page, CONTAINS for live search
export const RESULTS_PAGE_PATTERN = SEARCH_PATTERN.PREFIX
export const LIVE_SEARCH_PATTERN = SEARCH_PATTERN.CONTAINS

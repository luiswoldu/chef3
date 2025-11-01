# Search System Documentation

## File Inventory

### Components
- `components/SearchBar.tsx` - Search trigger button (toggles SearchView overlay)
- `components/SearchView.tsx` - Search input with live results dropdown (debounced 200ms)

### Pages & Routes
- `app/search/page.tsx` - Search results page wrapper
- `app/search/SearchWrapper.tsx` - Dynamic import wrapper (SSR disabled)
- `app/search/SearchResults.tsx` - Main search results rendering (client-side)
- `app/search/ingredient/layout.tsx` - Layout wrapper for ingredient search
- `app/search/ingredient/[slug]/page.tsx` - Ingredient-specific recipe results (server-side)

### Backend/Library Functions
- `lib/supabase/client.ts` - `fullTextSearch()` function (title-only, ilike matching)
- `lib/supabase/server.ts` - `getRecipesByIngredient()` function (server-side ingredient search)
- `lib/api.ts` - `fetchRecipeByName()` helper function
- `lib/db.ts` - `getRecipeByName()` and `searchRecipesFullText()` (stub, returns empty array)

### Database Migrations
- `supabase/migrations/20240320000000_create_search_history.sql` - Search history table (unused)
- `supabase/migrations/20240510000000_add_full_text_search.sql` - PostgreSQL FTS setup (unused)

---

## Current Data Flow

### Flow 1: Live Search Overlay (SearchBar → SearchView)

1. **User clicks search icon** → `SearchBar` sets `isSearching = true`
2. **SearchView renders** as fullscreen overlay with auto-focused input
3. **User types** → `searchQuery` state updates
4. **Debounce (200ms)** → Calls `fullTextSearch(searchQuery)` from `lib/supabase/client.ts`
5. **Query executes**:
   ```typescript
   supabase
     .from('recipes')
     .select('id, title')
     .ilike('title', `%${query}%`)
   ```
6. **Results render** in dropdown as clickable recipe cards
7. **User clicks result** → Navigate to `/recipe/{id}`
8. **User presses Enter** → Navigate to `/search?q={query}` (full results page)

### Flow 2: Search Results Page (/search?q=...)

1. **User navigates** to `/search?q={query}` (from SearchView or direct URL)
2. **SearchResults.tsx** extracts `q` param via `useSearchParams()`
3. **useEffect triggers** search on query change
4. **Query executes** (client-side):
   ```typescript
   supabase
     .from('recipes')
     .select('*')
     .eq('user_id', user.id)  // User-scoped only!
     .ilike('title', `${query}%`)  // Prefix match only!
   ```
5. **Results render** in responsive grid (1/2/3 columns)
6. **No pagination** - all results load at once

### Flow 3: Ingredient Search (/search/ingredient/[slug])

1. **User navigates** to `/search/ingredient/{ingredient_name}`
2. **Server component** decodes slug via `decodeURIComponent()`
3. **Calls** `getRecipesByIngredient(ingredientName)` from `lib/supabase/server.ts`
4. **Two-step query**:
   ```typescript
   // Step 1: Find matching ingredients
   supabase
     .from('ingredients')
     .select('recipe_id')
     .ilike('name', `%${ingredientName}%`)
   
   // Step 2: Fetch complete recipes by IDs
   supabase
     .from('recipes')
     .select('*, ingredients (*)')
     .in('id', recipeIds)
   ```
5. **Results render** in same grid layout as search page
6. **No user scoping** - searches all recipes in database

---

## Current Matching Behavior

### Search Method: ILIKE Pattern Matching

**SearchView (live overlay):**
- Pattern: `%{query}%` (contains match anywhere)
- Table: `recipes.title`
- Scope: All recipes (no user_id filter)
- Case-insensitive
- Returns: id, title only

**SearchResults Page:**
- Pattern: `${query}%` (prefix match only) ⚠️
- Table: `recipes.title`
- Scope: Current user's recipes only
- Case-insensitive
- Returns: Full recipe object

**Ingredient Search:**
- Pattern: `%{ingredientName}%` (contains match anywhere)
- Table: `ingredients.name`
- Scope: All recipes (no user_id filter)
- Case-insensitive
- Returns: Full recipe with ingredients

### Fields Searched
- ✅ `recipes.title` (all search methods)
- ✅ `ingredients.name` (ingredient search only)
- ❌ `recipes.caption` (not searched)
- ❌ `recipes.tags` (not searched)
- ❌ `recipes.steps` (not searched)

### Tables Hit
- `recipes` - Primary table for all searches
- `ingredients` - Only for ingredient-specific search
- `featured_library` - Not searchable (browse only)
- `search_history` - Created but never used

---

## Known Limits

### Performance Issues
1. **No indexing for ILIKE** - Full table scans on `title` column
2. **No pagination** - All results load at once (could be slow with 1000+ recipes)
3. **No result ranking** - Random database order, no relevance scoring
4. **Client-side search** on results page (not server-side)

### Functional Gaps
1. **Inconsistent patterns**: Live search uses `%query%`, results page uses `query%`
2. **User scoping inconsistency**: Results page filters by user, live search doesn't
3. **No multi-field search** - Only searches title, ignores caption/tags/steps
4. **No fuzzy matching** - Typos return no results
5. **No search history** - Table exists but unused
6. **No saved searches** - No persistence of common queries
7. **No autocomplete/suggestions** - Beyond live results

### Unused Infrastructure
1. **PostgreSQL Full-Text Search (FTS)** - Migration exists, configured, but never called:
   - `recipes.searchable_title` tsvector column
   - `ingredients.searchable_name` tsvector column
   - GIN indexes on both
   - `search_recipes()` RPC function (searches title + ingredients)
2. **search_history table** - No insert/read operations
3. **searchRecipesFullText()** - Stub function returns empty array

### Security/Privacy
1. **Live search** shows all users' recipes (no privacy filter)
2. **Ingredient search** shows all users' recipes (no privacy filter)
3. Only results page respects user boundaries

---

## TODO: Stage-2 (GPT-5 Semantic Search)

### Objectives
Replace basic ILIKE matching with GPT-5-powered semantic search for intelligent, context-aware results.

### Implementation Plan

#### 1. Generate Recipe Embeddings
- [ ] Add `embedding` column to recipes table (vector type, dimension 1536 or 3072)
- [ ] Create background job to generate embeddings for existing recipes
- [ ] Add embedding generation to recipe creation flow
- [ ] Fields to embed: title + caption + tags + first 3 steps (concatenated)

#### 2. Implement Semantic Search API
- [ ] Create `/api/search-semantic` endpoint
- [ ] Input: Natural language query (e.g., "quick pasta dishes for kids")
- [ ] Generate query embedding via GPT-5 API
- [ ] Cosine similarity search against recipe embeddings
- [ ] Return top N results ranked by similarity score

#### 3. Update Search UI
- [ ] Add "smart search" toggle in SearchView
- [ ] Show relevance scores or confidence indicators
- [ ] Highlight matched concepts (not just keywords)
- [ ] Add "refine search" suggestions based on query understanding

#### 4. Hybrid Search Strategy
- [ ] Combine semantic search with keyword matching
- [ ] Use semantic search for complex queries (>3 words)
- [ ] Fall back to ILIKE for simple keyword searches
- [ ] Weighted scoring: 70% semantic, 30% exact match

#### 5. Query Understanding
- [ ] Use GPT-5 to extract search intent (ingredient, cuisine, diet, time, difficulty)
- [ ] Parse complex queries: "easy vegetarian recipes under 30 minutes"
- [ ] Filter by extracted attributes + semantic similarity
- [ ] Support conversational queries: "something like pad thai but simpler"

#### 6. Performance Optimization
- [ ] Cache query embeddings (hash → embedding mapping)
- [ ] Index embeddings with pgvector or Pinecone
- [ ] Set similarity threshold (e.g., 0.75) to avoid irrelevant results
- [ ] Batch embedding generation (avoid per-request API calls)

#### 7. Testing & Validation
- [ ] A/B test semantic vs. keyword search
- [ ] Collect user feedback on result quality
- [ ] Track click-through rates on search results
- [ ] Monitor GPT-5 API costs and latency

---

## TODO: Stage-3 (RAG with Recipe Recommendations)

### Objectives
Build a Retrieval-Augmented Generation (RAG) system for personalized recipe discovery and recommendations.

### Implementation Plan

#### 1. User Preference Modeling
- [ ] Track user interactions: viewed recipes, saved recipes, search history
- [ ] Build user taste profile from interaction data
- [ ] Store user embedding vector (aggregate of preferred recipes)
- [ ] Update profile embedding over time (rolling average)

#### 2. RAG Architecture
- [ ] **Retrieval**: Find top K similar recipes to user query + user profile
- [ ] **Augmentation**: Inject retrieved recipes as context to GPT-5
- [ ] **Generation**: GPT-5 generates personalized recommendations with explanations
- [ ] Example prompt:
   ```
   User profile: Prefers Italian, vegetarian, quick meals
   Search query: "dinner ideas"
   Top retrieved recipes: [recipe1, recipe2, recipe3]
   
   Task: Recommend 3 recipes and explain why each fits the user's preferences.
   ```

#### 3. Conversational Search
- [ ] Multi-turn conversation support (store context in session)
- [ ] Follow-up queries: "Show me something spicier" → Uses previous results as context
- [ ] Refinement: "Not that, show me Chinese instead"
- [ ] Clarifying questions: GPT asks "Do you want something quick or fancy?"

#### 4. Recipe Explanation & Customization
- [ ] Generate natural language explanations for each recommendation
- [ ] Suggest substitutions based on user preferences or restrictions
- [ ] Answer "Why did you suggest this?" → RAG retrieves similar liked recipes as evidence
- [ ] Interactive refinement: "Make it vegan" → GPT modifies recipe on-the-fly

#### 5. Smart Filters via RAG
- [ ] Natural language filters: "no nuts", "low carb", "under 30 minutes"
- [ ] GPT extracts filter criteria from conversational input
- [ ] Apply filters to retrieval phase (combine embedding + attribute filters)
- [ ] Explain filter decisions: "Filtered out X recipes due to prep time"

#### 6. Ingredient-Based RAG
- [ ] Search: "What can I make with chicken, rice, and tomatoes?"
- [ ] Retrieval: Find recipes containing those ingredients
- [ ] Generation: GPT suggests creative combinations or variations
- [ ] Handle missing ingredients: "You'll need onions, do you have any?"

#### 7. Personalized Discovery Feed
- [ ] Daily recipe recommendations based on user profile
- [ ] "Recipes you might like" section on home page
- [ ] Diversity optimization: Don't recommend same cuisine repeatedly
- [ ] Serendipity factor: Occasionally suggest outside comfort zone

#### 8. Context-Aware Search
- [ ] Time-of-day awareness: Morning → breakfast recipes
- [ ] Season awareness: Summer → light salads, Winter → soups
- [ ] Occasion detection: "party food", "meal prep", "date night"
- [ ] Dietary restrictions from user profile (auto-applied)

#### 9. Feedback Loop
- [ ] Explicit feedback: Thumbs up/down on recommendations
- [ ] Implicit feedback: Recipe views, saves, shares
- [ ] Update user embedding based on feedback
- [ ] Fine-tune retrieval weights (semantic vs. user profile)

#### 10. Cost & Performance Monitoring
- [ ] Cache RAG responses for common queries
- [ ] Limit GPT-5 calls with smart retrieval (only call when needed)
- [ ] Progressive enhancement: Start with retrieval, add generation if requested
- [ ] Monitor per-user API costs and set budgets

---

## Migration Strategy

### Phase 1: Parallel Testing (Weeks 1-2)
- Deploy semantic search alongside existing ILIKE
- A/B test with 10% of users
- Measure: Latency, result quality, user engagement

### Phase 2: Gradual Rollout (Weeks 3-4)
- Increase semantic search to 50% of users
- Collect feedback via in-app surveys
- Optimize based on performance metrics

### Phase 3: Full Migration (Week 5)
- Switch all users to semantic search
- Keep ILIKE as fallback for errors
- Monitor for regressions

### Phase 4: RAG Rollout (Weeks 6-8)
- Launch conversational search as beta feature
- Invite power users to test
- Iterate based on qualitative feedback

### Phase 5: Personalization (Weeks 9-12)
- Deploy personalized recommendations
- Build user profile models
- Continuous improvement loop

---

## Success Metrics

### Stage-2 (Semantic Search)
- **Search relevance**: Average similarity score > 0.8
- **User engagement**: Click-through rate increase by 20%
- **Query complexity**: Support 3+ word queries effectively
- **Latency**: <500ms for semantic search (including embedding generation)

### Stage-3 (RAG)
- **Recommendation accuracy**: 60%+ of recommendations get saved/viewed
- **User satisfaction**: NPS score > 8/10 for search experience
- **Conversation success**: 70%+ of multi-turn queries resolved without manual search
- **Discovery**: 30% of recipe views come from RAG recommendations

---

## Open Questions

1. **Privacy**: Should embeddings include user-generated content (captions/notes)? Data retention policy?
2. **Cost**: What's acceptable cost per search? Budget for GPT-5 API calls?
3. **Accuracy**: How to handle hallucinations in RAG responses (wrong ingredients/steps)?
4. **Bias**: How to ensure diverse recommendations (not just popular recipes)?
5. **Multimodal**: Should we embed recipe images for visual similarity search?
6. **Real-time**: Should user profile embeddings update in real-time or batch?
7. **Explainability**: How much transparency into "why this result" do users want?
8. **Offline**: Fallback strategy if GPT-5 API is down or slow?

---

## References

- Current search code: `components/SearchView.tsx`, `app/search/SearchResults.tsx`
- Unused FTS: `supabase/migrations/20240510000000_add_full_text_search.sql`
- Supabase vector extension: https://supabase.com/docs/guides/ai/vector-columns
- OpenAI embeddings: https://platform.openai.com/docs/guides/embeddings
- RAG best practices: https://www.anthropic.com/index/retrieval-augmented-generation

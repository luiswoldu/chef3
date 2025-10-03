import * as cheerio from 'cheerio'

interface Recipe {
  title: string
  image: string
  caption: string
  tags: string[]
  steps: string[]
  created_at: string
}

interface Ingredient {
  name: string
  amount: string
  details: string
  created_at: string
}

interface GroceryItem {
  name: string
  amount: string
  details: string
  aisle: string
  purchased: boolean
  created_at: string
}

interface RecipeData {
  recipe: Recipe
  ingredients: Ingredient[]
  groceryItems: GroceryItem[]
}

export class FastRecipeParser {
  parseHtml(html: string, url: string): RecipeData | null {
    const $ = cheerio.load(html)
    const now = new Date().toISOString()

    try {
      // Try to extract JSON-LD structured data first (fastest method)
      const jsonLdData = this.extractJsonLD($)
      if (jsonLdData) {
        return this.normalizeJsonLD(jsonLdData, now)
      }

      // Fallback to HTML parsing
      return this.parseWithSelectors($, url, now)
    } catch (error) {
      console.error('Parse error:', error)
      return null
    }
  }

  private extractJsonLD($: cheerio.CheerioAPI): any {
    const scripts = $('script[type="application/ld+json"]')
    
    for (let i = 0; i < scripts.length; i++) {
      try {
        const scriptContent = $(scripts[i]).html()
        if (!scriptContent) continue
        
        const data = JSON.parse(scriptContent)
        
        // Handle arrays of structured data
        const recipes = Array.isArray(data) ? data : [data]
        
        for (const item of recipes) {
          if (this.isRecipeSchema(item)) {
            return item
          }
          // Check nested graphs
          if (item['@graph']) {
            for (const graphItem of item['@graph']) {
              if (this.isRecipeSchema(graphItem)) {
                return graphItem
              }
            }
          }
        }
      } catch (e) {
        continue
      }
    }
    
    return null
  }

  private isRecipeSchema(item: any): boolean {
    if (!item['@type']) return false
    const type = Array.isArray(item['@type']) ? item['@type'].join(' ') : item['@type']
    return type.toLowerCase().includes('recipe')
  }

  private normalizeJsonLD(data: any, timestamp: string): RecipeData {
    const ingredients = this.extractIngredients(data.recipeIngredient || [])
    
    return {
      recipe: {
        title: data.name || 'Untitled Recipe',
        image: this.extractImage(data.image) || '',
        caption: data.description || '',
        tags: this.extractTags(data),
        steps: this.extractSteps(data.recipeInstructions || []),
        created_at: timestamp
      },
      ingredients: ingredients,
      groceryItems: ingredients.map(ing => ({
        ...ing,
        aisle: '',
        purchased: false
      }))
    }
  }

  private parseWithSelectors($: cheerio.CheerioAPI, url: string, timestamp: string): RecipeData {
    // Extract basic info
    const title = this.extractTitle($)
    const image = this.extractImageFromHtml($, url)
    const description = this.extractDescription($)
    
    // Extract ingredients and steps
    const ingredients = this.extractIngredientsFromHtml($, timestamp)
    const steps = this.extractStepsFromHtml($)
    const tags = this.extractTagsFromHtml($)

    return {
      recipe: {
        title: title || 'Untitled Recipe',
        image: image || '',
        caption: description || '',
        tags: tags,
        steps: steps,
        created_at: timestamp
      },
      ingredients: ingredients,
      groceryItems: ingredients.map(ing => ({
        ...ing,
        aisle: '',
        purchased: false
      }))
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      'h1[class*="recipe" i]',
      'h1[class*="title" i]',
      '[class*="recipe-title" i]',
      '[itemprop="name"]',
      'h1',
      'title'
    ]

    for (const selector of selectors) {
      const text = $(selector).first().text().trim()
      if (text && text.length > 3) {
        return text
      }
    }
    return ''
  }

  private extractImageFromHtml($: cheerio.CheerioAPI, url: string): string {
    const selectors = [
      'meta[property="og:image"]',
      'img[class*="recipe" i]',
      'img[class*="hero" i]',
      '[itemprop="image"]',
      'img[class*="featured" i]'
    ]

    for (const selector of selectors) {
      const element = $(selector).first()
      const src = element.attr('src') || element.attr('content')
      if (src) {
        return src.startsWith('http') ? src : new URL(src, url).href
      }
    }
    return ''
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    const selectors = [
      'meta[property="og:description"]',
      'meta[name="description"]',
      '[class*="recipe-description" i]',
      '[class*="recipe-summary" i]',
      '[itemprop="description"]'
    ]

    for (const selector of selectors) {
      const text = $(selector).attr('content') || $(selector).text().trim()
      if (text && text.length > 10) {
        return text
      }
    }
    return ''
  }

  private extractIngredientsFromHtml($: cheerio.CheerioAPI, timestamp: string): Ingredient[] {
    const selectors = [
      '[itemprop="recipeIngredient"]',
      '.recipe-ingredient',
      '.ingredient',
      '.recipe-ingredients li',
      '.ingredients li'
    ]

    for (const selector of selectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        const ingredients: Ingredient[] = []
        elements.each((i, el) => {
          const text = $(el).text().trim()
          if (text) {
            const parsed = this.parseIngredient(text)
            ingredients.push({
              ...parsed,
              created_at: timestamp
            })
          }
        })
        if (ingredients.length > 0) {
          return ingredients
        }
      }
    }
    return []
  }

  private extractStepsFromHtml($: cheerio.CheerioAPI): string[] {
    const selectors = [
      '[itemprop="recipeInstructions"]',
      '.recipe-instruction',
      '.instruction',
      '.recipe-instructions li',
      '.instructions li',
      '.recipe-method li'
    ]

    for (const selector of selectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        const steps: string[] = []
        elements.each((i, el) => {
          const text = $(el).text().trim()
          if (text && text.length > 10) {
            steps.push(text.replace(/^\d+\.?\s*/, ''))
          }
        })
        if (steps.length > 0) {
          return steps
        }
      }
    }
    return []
  }

  private extractTagsFromHtml($: cheerio.CheerioAPI): string[] {
    const tags: string[] = []
    
    const selectors = [
      '[itemprop="recipeCategory"]',
      '[itemprop="recipeCuisine"]',
      '.recipe-tags a',
      '.tags a'
    ]

    for (const selector of selectors) {
      $(selector).each((i, el) => {
        const text = $(el).text().trim()
        if (text && !tags.includes(text)) {
          tags.push(text)
        }
      })
    }

    return tags.slice(0, 3)
  }

  private extractIngredients(ingredients: any[]): Ingredient[] {
    const timestamp = new Date().toISOString()
    return ingredients.map(ing => {
      const text = typeof ing === 'string' ? ing : ing.text || ''
      return {
        ...this.parseIngredient(text),
        created_at: timestamp
      }
    })
  }

  private extractSteps(instructions: any[]): string[] {
    return instructions.map(inst => {
      if (typeof inst === 'string') return inst
      return inst.text || ''
    }).filter(step => step.length > 5)
  }

  private extractTags(data: any): string[] {
    const tags: string[] = []
    
    if (data.recipeCategory) {
      const categories = Array.isArray(data.recipeCategory) ? data.recipeCategory : [data.recipeCategory]
      tags.push(...categories)
    }
    
    if (data.recipeCuisine) {
      const cuisines = Array.isArray(data.recipeCuisine) ? data.recipeCuisine : [data.recipeCuisine]
      tags.push(...cuisines)
    }

    return tags.slice(0, 3)
  }

  private extractImage(imageData: any): string {
    if (!imageData) return ''
    
    if (typeof imageData === 'string') return imageData
    
    if (Array.isArray(imageData)) {
      return imageData[0]?.url || imageData[0] || ''
    }
    
    if (imageData.url) return imageData.url
    if (imageData['@id']) return imageData['@id']
    
    return ''
  }

  private parseIngredient(text: string): { name: string; amount: string; details: string } {
    // Simple ingredient parsing
    const cleaned = text.trim()
    
    // Try to extract amount at the beginning
    const amountMatch = cleaned.match(/^([0-9\s/¼½¾⅓⅔⅛⅜⅝⅞]+(?:\s*(?:cups?|tbsp?|tsp?|lbs?|oz|pounds?|ounces?|grams?|g|kg|ml|l|cloves?|pieces?))?)\s*/)
    
    if (amountMatch) {
      const amount = amountMatch[1].trim()
      const rest = cleaned.substring(amountMatch[0].length).trim()
      
      // Separate preparation details
      const prepWords = ['chopped', 'diced', 'sliced', 'minced', 'grated', 'fresh', 'frozen', 'dried']
      const words = rest.split(' ')
      const nameWords: string[] = []
      const detailWords: string[] = []
      
      for (const word of words) {
        if (prepWords.some(prep => word.toLowerCase().includes(prep))) {
          detailWords.push(word)
        } else {
          nameWords.push(word)
        }
      }
      
      return {
        name: nameWords.join(' ').trim() || rest,
        amount: amount,
        details: detailWords.join(' ').trim()
      }
    }
    
    return {
      name: cleaned,
      amount: '',
      details: ''
    }
  }
}

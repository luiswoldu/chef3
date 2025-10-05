import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FastRecipeParser } from '@/lib/fast-recipe-parser'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function downloadAndStoreImage(imageUrl: string): Promise<string> {
  try {
    // Download image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return imageUrl // Return original URL if download fails
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Generate unique filename
    const urlHash = Buffer.from(imageUrl).toString('base64').slice(0, 8)
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
    const filename = `recipe-images/${urlHash}-${Date.now()}.${extension}`
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(filename, buffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading image:', error)
      return imageUrl // Return original URL if upload fails
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filename)
    
    return publicUrlData.publicUrl || imageUrl
  } catch (error) {
    console.error('Error processing image:', error)
    return imageUrl // Return original URL as fallback
  }
}

async function extractRecipeWithOpenAI(html: string, url: string): Promise<any> {
  // Clean HTML text for OpenAI
  const cheerio = await import('cheerio')
  const $ = cheerio.load(html)
  
  // Remove scripts, styles, nav, footer, ads
  $('script, style, nav, footer, .ad, .advertisement, .sidebar').remove()
  
  const cleanedText = $('body').text()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 8000) // Limit to avoid token limits
  
  // Try to find image from HTML meta tags
  const imageUrl = $('meta[property="og:image"]').attr('content') || 
                   $('img[class*="recipe" i]').first().attr('src') ||
                   $('img[class*="hero" i]').first().attr('src') || ''

  const prompt = `Extract recipe information from this webpage text. Return a JSON object with this exact structure:

{
  "recipe": {
    "title": "Recipe Name",
    "image": "${imageUrl || ''}",
    "caption": "Recipe description",
    "tags": ["tag1", "tag2"],
    "steps": ["step1", "step2"],
    "created_at": "${new Date().toISOString()}"
  },
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity",
      "details": "preparation details",
      "created_at": "${new Date().toISOString()}"
    }
  ],
  "groceryItems": [
    {
      "name": "ingredient name",
      "amount": "quantity",
      "details": "preparation details",
      "aisle": "",
      "purchased": false,
      "created_at": "${new Date().toISOString()}"
    }
  ]
}

Webpage text:\n${cleanedText}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.1,
      max_tokens: 4000
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from OpenAI')

    // Find JSON in response - try different patterns
    let jsonStr = ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    } else {
      throw new Error('No JSON found in response')
    }

    // Try to fix common JSON issues
    try {
      return JSON.parse(jsonStr)
    } catch (parseError) {
      console.log('Initial JSON parse failed, attempting to fix...', parseError)
      
      // Try to fix common issues with malformed JSON
      let fixedJson = jsonStr
        .replace(/,\s*}/g, '}') // Remove trailing commas before }
        .replace(/,\s*\]/g, ']') // Remove trailing commas before ]
        .replace(/"([^"]+)":\s*"([^"]*)",?/g, '"$1":"$2",') // Ensure proper comma placement
        .replace(/,\s*([}\]])/g, '$1') // Remove any remaining trailing commas
      
      // Remove the last comma if it exists before closing brace
      fixedJson = fixedJson.replace(/,([^,]*[}\]])$/g, '$1')
      
      // Handle truncated JSON - check if it looks incomplete
      const openBraces = (fixedJson.match(/\{/g) || []).length
      const closeBraces = (fixedJson.match(/\}/g) || []).length
      const openBrackets = (fixedJson.match(/\[/g) || []).length
      const closeBrackets = (fixedJson.match(/\]/g) || []).length
      
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        console.log('JSON appears truncated, attempting to close...')
        // Remove any trailing incomplete entries
        let truncatedJson = fixedJson
        
        // Find the last complete ingredient/grocery item and truncate there
        const lastCompleteItem = truncatedJson.lastIndexOf('},')
        if (lastCompleteItem > 0) {
          truncatedJson = truncatedJson.substring(0, lastCompleteItem + 1)
        }
        
        // Close any open arrays and objects
        const missingCloseBrackets = openBrackets - closeBrackets
        const missingCloseBraces = openBraces - closeBraces
        
        for (let i = 0; i < missingCloseBrackets; i++) {
          truncatedJson += ']'
        }
        for (let i = 0; i < missingCloseBraces; i++) {
          truncatedJson += '}'
        }
        
        fixedJson = truncatedJson
      }
      
      try {
        return JSON.parse(fixedJson)
      } catch (secondError) {
        console.error('Failed to parse even after JSON fixes:', secondError)
        console.error('Original JSON:', jsonStr)
        console.error('Fixed attempt:', fixedJson)
        throw new Error('Invalid JSON format from OpenAI response')
      }
    }
  } catch (error) {
    console.error('OpenAI extraction error:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  const startTime = Date.now()

  try {
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()
    
    let extractedData = null
    
    // Try fast HTML parser first
    console.log('Trying fast HTML parser for URL:', url)
    const parser = new FastRecipeParser()
    extractedData = parser.parseHtml(html, url)
    
    // Validate if extracted data is meaningful
    const isValidExtraction = (data: any) => {
      if (!data || !data.recipe) return false
      
      const { recipe, ingredients } = data
      
      // Check if we have at least a title and some content
      const hasTitle = recipe.title && recipe.title.length > 3
      const hasIngredients = ingredients && ingredients.length > 0
      const hasSteps = recipe.steps && recipe.steps.length > 0
      
      return hasTitle && (hasIngredients || hasSteps)
    }
    
    console.log('Fast parser result:', {
      hasData: !!extractedData,
      isValid: isValidExtraction(extractedData),
      title: extractedData?.recipe?.title,
      ingredientCount: extractedData?.ingredients?.length,
      stepCount: extractedData?.recipe?.steps?.length
    })
    
    // If fast parser fails or returns invalid data, fall back to OpenAI
    if (!extractedData || !isValidExtraction(extractedData)) {
      console.log('Fast parser failed, falling back to OpenAI...')
      try {
        extractedData = await extractRecipeWithOpenAI(html, url)
      } catch (openaiError) {
        console.error('OpenAI fallback also failed:', openaiError)
        return NextResponse.json(
          { error: 'No recipe found on this page' },
          { status: 404 }
        )
      }
    }
    
    // Download and store image if present
    if (extractedData.recipe.image) {
      const imageStartTime = Date.now()
      const storedImageUrl = await downloadAndStoreImage(extractedData.recipe.image)
      extractedData.recipe.image = storedImageUrl
    }
    
    return NextResponse.json(extractedData)
    
  } catch (error) {
    console.error('Error extracting recipe:', error)
    return NextResponse.json(
      { error: 'An error occurred while extracting the recipe' },
      { status: 500 }
    )
  }
}

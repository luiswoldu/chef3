import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // Fetch the HTML content of the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeExtractor/1.0; +https://yourwebsite.com)'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()
    
    // Extract text content and clean it up for OpenAI
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    // Truncate content to avoid token limits (roughly 8000 characters)
    const truncatedContent = textContent.substring(0, 8000)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a recipe extraction expert. Extract recipe information from the provided web page content and return it as a JSON object. The JSON should have this exact structure:

{
  "recipe": {
    "title": "Recipe name",
    "image": "URL to recipe image (if found, otherwise empty string)",
    "caption": "Recipe description",
    "tags": ["tag1", "tag2", "tag3"], // max 3 tags
    "steps": ["step 1", "step 2", "step 3"], // array of cooking instructions
    "created_at": "current ISO timestamp"
  },
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity/measurement",
      "details": "additional details like preparation method",
      "created_at": "current ISO timestamp"
    }
  ],
  "groceryItems": [
    {
      "name": "ingredient name",
      "amount": "quantity/measurement", 
      "details": "additional details",
      "aisle": "",
      "purchased": false,
      "created_at": "current ISO timestamp"
    }
  ]
}

Important:
- Only return valid JSON, no additional text
- If no recipe is found, return an error object: {"error": "No recipe found on this page"}
- Parse ingredient amounts carefully (e.g., "1 cup flour" -> name: "flour", amount: "1 cup")
- For images, prefer absolute URLs if available
- Keep tags relevant and concise
- Break down cooking instructions into clear steps`
        },
        {
          role: "user",
          content: `Extract the recipe from this web page content:\n\n${truncatedContent}`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const result = completion.choices[0]?.message?.content
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to extract recipe from OpenAI' },
        { status: 500 }
      )
    }

    try {
      const parsedResult = JSON.parse(result)
      
      // Validate the response structure
      if (parsedResult.error) {
        return NextResponse.json(
          { error: parsedResult.error },
          { status: 404 }
        )
      }
      
      if (!parsedResult.recipe || !parsedResult.ingredients || !parsedResult.groceryItems) {
        return NextResponse.json(
          { error: 'Invalid recipe data structure from OpenAI' },
          { status: 500 }
        )
      }

      return NextResponse.json(parsedResult)
      
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse OpenAI response as JSON' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Error extracting recipe with OpenAI:', error)
    return NextResponse.json(
      { error: 'An error occurred while extracting the recipe' },
      { status: 500 }
    )
  }
} 
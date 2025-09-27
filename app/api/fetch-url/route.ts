import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FastRecipeParser } from '@/lib/fast-recipe-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    
    // Use fast HTML parser
    const parser = new FastRecipeParser()
    const extractedData = parser.parseHtml(html, url)
    
    if (!extractedData) {
      return NextResponse.json(
        { error: 'No recipe found on this page' },
        { status: 404 }
      )
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

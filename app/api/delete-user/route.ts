import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: Request) {
  try {
    // Ensure request is JSON
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Content-Type must be application/json' 
        }),
        { 
          status: 415,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the user's ID from the request
    const { userId } = await request.json()
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'User ID is required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete user's profile first
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to delete user profile', 
          details: profileError.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete the user's auth account
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    )

    if (deleteError) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to delete user account', 
          details: deleteError.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error deleting user:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Keep POST method for backward compatibility if needed
export async function POST(request: Request) {
  return DELETE(request)
} 
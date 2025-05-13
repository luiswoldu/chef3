import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: Request) {
  try {
    // Get the user's ID from the request
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Delete user's profile first
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user profile', details: profileError.message },
        { status: 500 }
      )
    }

    // Delete the user's auth account
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    )

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user account', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// Keep POST method for backward compatibility if needed
export async function POST(request: Request) {
  return DELETE(request)
} 
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ai: process.env.ENABLE_AI_SEARCH === 'true'
  })
}

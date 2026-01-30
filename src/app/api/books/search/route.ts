import { NextResponse } from 'next/server'
import { searchBooks } from '@/lib/openlibrary'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  try {
    const results = await searchBooks(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Open Library search error:', error)
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    )
  }
}

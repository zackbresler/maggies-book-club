import { NextResponse } from 'next/server'
import { getEnglishEditionIsbn } from '@/lib/openlibrary'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const workKey = searchParams.get('workKey')

  if (!workKey) {
    return NextResponse.json(
      { error: 'Work key is required' },
      { status: 400 }
    )
  }

  try {
    const result = await getEnglishEditionIsbn(workKey)

    if (!result) {
      return NextResponse.json(
        { isbn13: null, isbn10: null, coverId: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      isbn13: result.isbn13,
      isbn10: result.isbn10,
      coverId: result.coverId
    })
  } catch (error) {
    console.error('Error fetching English edition ISBN:', error)
    return NextResponse.json(
      { error: 'Failed to fetch English edition' },
      { status: 500 }
    )
  }
}

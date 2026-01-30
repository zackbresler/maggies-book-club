import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const books = await prisma.book.findMany({
    where: status ? { status } : undefined,
    include: {
      addedBy: {
        select: { id: true, name: true }
      },
      ratings: {
        select: { rating: true, userId: true }
      }
    },
    orderBy: { addedAt: 'desc' }
  })

  const booksWithAvgRating = books.map((book) => {
    const avgRating = book.ratings.length > 0
      ? book.ratings.reduce((sum, r) => sum + r.rating, 0) / book.ratings.length
      : null
    return {
      ...book,
      averageRating: avgRating,
      ratingCount: book.ratings.length
    }
  })

  return NextResponse.json(booksWithAvgRating)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      author,
      isbn,
      isbn13,
      coverUrl,
      synopsis,
      openLibraryKey,
      pageCount,
      publishYear,
      status = 'SUGGESTION'
    } = body

    if (!title || !author) {
      return NextResponse.json(
        { error: 'Title and author are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['CURRENT', 'SUGGESTION', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Non-admin users can only add books as suggestions
    const finalStatus = session.user.isAdmin ? status : 'SUGGESTION'

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        isbn13,
        coverUrl,
        synopsis,
        openLibraryKey,
        pageCount,
        publishYear,
        status: finalStatus,
        addedById: session.user.id
      }
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Create book error:', error)
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    )
  }
}

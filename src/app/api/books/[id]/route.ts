import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBookByIsbn, getBookByOpenLibraryKey } from '@/lib/openlibrary'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: {
      addedBy: {
        select: { id: true, name: true }
      },
      ratings: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      },
      questions: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const avgRating = book.ratings.length > 0
    ? book.ratings.reduce((sum, r) => sum + r.rating, 0) / book.ratings.length
    : null

  // Fetch description from Open Library if we don't have a synopsis
  let synopsis = book.synopsis
  if (!synopsis) {
    try {
      let openLibraryData = null

      // Try fetching by Open Library key first (most reliable)
      if (book.openLibraryKey) {
        openLibraryData = await getBookByOpenLibraryKey(book.openLibraryKey)
      }

      // Fall back to ISBN if no key or no description found
      if (!openLibraryData?.description && (book.isbn13 || book.isbn)) {
        openLibraryData = await getBookByIsbn(book.isbn13 || book.isbn || '')
      }

      if (openLibraryData?.description) {
        synopsis = openLibraryData.description
      }
    } catch (error) {
      console.error('Failed to fetch Open Library description:', error)
    }
  }

  return NextResponse.json({
    ...book,
    synopsis,
    averageRating: avgRating,
    ratingCount: book.ratings.length
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { status, synopsis } = body

  // Only admins can change status
  if (status && !session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Only admins can change book status' },
      { status: 403 }
    )
  }

  if (status) {
    const validStatuses = ['CURRENT', 'SUGGESTION', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
  }

  try {
    const updateData: { status?: string; synopsis?: string } = {}
    if (status) updateData.status = status
    if (synopsis !== undefined) updateData.synopsis = synopsis

    const book = await prisma.book.update({
      where: { id: params.id },
      data: updateData
    })

    // If a book is being set to CURRENT, clear all votes
    // This resets the poll for the next round of voting
    if (status === 'CURRENT') {
      await prisma.vote.deleteMany({})
    }

    return NextResponse.json(book)
  } catch {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find the book first to check permissions
  const book = await prisma.book.findUnique({
    where: { id: params.id }
  })

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  // Admins can delete any book
  // Non-admins can only delete their own suggestions
  const isOwner = book.addedById === session.user.id
  const isSuggestion = book.status === 'SUGGESTION'

  if (!session.user.isAdmin && !(isOwner && isSuggestion)) {
    return NextResponse.json(
      { error: 'You can only delete your own suggestions' },
      { status: 403 }
    )
  }

  try {
    await prisma.book.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Book deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}

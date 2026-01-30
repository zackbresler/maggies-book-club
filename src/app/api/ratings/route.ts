import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { bookId, rating } = body

    if (!bookId || !rating) {
      return NextResponse.json(
        { error: 'Book ID and rating are required' },
        { status: 400 }
      )
    }

    // Validate rating is between 0.5 and 5, in 0.5 increments
    if (rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      return NextResponse.json(
        { error: 'Rating must be between 0.5 and 5, in 0.5 increments' },
        { status: 400 }
      )
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Upsert rating (create or update)
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId
        }
      }
    })

    let savedRating

    if (existingRating) {
      savedRating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: { rating }
      })
    } else {
      savedRating = await prisma.rating.create({
        data: {
          userId: session.user.id,
          bookId,
          rating
        }
      })
    }

    return NextResponse.json(savedRating)
  } catch (error) {
    console.error('Rating error:', error)
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ratingId = searchParams.get('id')

  if (!ratingId) {
    return NextResponse.json({ error: 'Rating ID is required' }, { status: 400 })
  }

  try {
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId }
    })

    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 })
    }

    // Only allow users to delete their own ratings (or admins)
    if (rating.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.rating.delete({
      where: { id: ratingId }
    })

    return NextResponse.json({ message: 'Rating deleted' })
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get current user's vote
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vote = await prisma.vote.findUnique({
    where: { userId: session.user.id },
    include: {
      book: {
        select: { id: true, title: true, author: true }
      }
    }
  })

  return NextResponse.json({ vote })
}

// Cast or change vote
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { bookId } = body

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Verify the book exists and is a suggestion
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    if (book.status !== 'SUGGESTION') {
      return NextResponse.json(
        { error: 'Can only vote for suggestions' },
        { status: 400 }
      )
    }

    // Upsert the vote (create or update)
    const vote = await prisma.vote.upsert({
      where: { userId: session.user.id },
      update: { bookId, createdAt: new Date() },
      create: {
        userId: session.user.id,
        bookId
      },
      include: {
        book: {
          select: { id: true, title: true, author: true }
        }
      }
    })

    return NextResponse.json({ vote })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json(
      { error: 'Failed to save vote' },
      { status: 500 }
    )
  }
}

// Remove vote
export async function DELETE() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.vote.delete({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ message: 'Vote removed' })
  } catch {
    // Vote might not exist, which is fine
    return NextResponse.json({ message: 'No vote to remove' })
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all current books (can be multiple)
  const currentBooks = await prisma.book.findMany({
    where: { status: 'CURRENT' },
    include: {
      ratings: {
        include: {
          user: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { addedAt: 'desc' }
  })

  // Get suggestions with vote counts, ordered by most votes
  const suggestions = await prisma.book.findMany({
    where: { status: 'SUGGESTION' },
    include: {
      votes: true,
      addedBy: { select: { id: true, name: true } }
    },
    orderBy: { addedAt: 'desc' }
  })

  // Sort suggestions by vote count (most votes first), then by most recent
  const suggestionsWithVotes = suggestions
    .map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      addedAt: book.addedAt,
      addedBy: book.addedBy,
      voteCount: book.votes.length
    }))
    .sort((a, b) => {
      // Sort by vote count descending, then by addedAt descending
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount
      }
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    })

  // Get current user's vote
  const userVote = await prisma.vote.findUnique({
    where: { userId: session.user.id },
    select: { bookId: true }
  })

  // Get recent ratings (last 10)
  const recentRatings = await prisma.rating.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
      book: { select: { id: true, title: true, author: true } }
    }
  })

  // Calculate stats
  const totalBooks = await prisma.book.count()
  const completedBooks = await prisma.book.count({ where: { status: 'COMPLETED' } })
  const totalRatings = await prisma.rating.count()

  // Get user's ratings for current books
  const userCurrentBookRatings = await prisma.rating.findMany({
    where: {
      userId: session.user.id,
      bookId: { in: currentBooks.map(b => b.id) }
    }
  })

  const userRatingsMap = new Map(
    userCurrentBookRatings.map(r => [r.bookId, r.rating])
  )

  // Format current books with average ratings and user ratings
  const formattedCurrentBooks = currentBooks.map(book => {
    const avgRating = book.ratings.length > 0
      ? book.ratings.reduce((sum, r) => sum + r.rating, 0) / book.ratings.length
      : null

    return {
      ...book,
      averageRating: avgRating,
      ratingCount: book.ratings.length,
      userRating: userRatingsMap.get(book.id) || null
    }
  })

  return NextResponse.json({
    currentBooks: formattedCurrentBooks,
    suggestions: suggestionsWithVotes,
    userVoteBookId: userVote?.bookId || null,
    recentRatings,
    stats: {
      totalBooks,
      completedBooks,
      totalRatings
    }
  })
}

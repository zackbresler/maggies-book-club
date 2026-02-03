import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can reorder questions
  if (!session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Only admins can reorder questions' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { questionIds } = body

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'questionIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify all questions belong to this book
    const questions = await prisma.discussionQuestion.findMany({
      where: {
        id: { in: questionIds },
        bookId: params.id
      }
    })

    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { error: 'Some questions were not found or do not belong to this book' },
        { status: 400 }
      )
    }

    // Update sortOrder for each question based on its position in the array
    await prisma.$transaction(
      questionIds.map((id: string, index: number) =>
        prisma.discussionQuestion.update({
          where: { id },
          data: { sortOrder: index }
        })
      )
    )

    // Return the updated questions
    const updatedQuestions = await prisma.discussionQuestion.findMany({
      where: { bookId: params.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(updatedQuestions)
  } catch {
    return NextResponse.json(
      { error: 'Failed to reorder questions' },
      { status: 500 }
    )
  }
}

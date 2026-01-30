import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const questions = await prisma.discussionQuestion.findMany({
    where: { bookId: params.id },
    orderBy: { sortOrder: 'asc' }
  })

  return NextResponse.json(questions)
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can add questions
  if (!session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Only admins can add discussion questions' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { question } = body

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: params.id }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Get the highest sortOrder for this book
    const lastQuestion = await prisma.discussionQuestion.findFirst({
      where: { bookId: params.id },
      orderBy: { sortOrder: 'desc' }
    })

    const newSortOrder = (lastQuestion?.sortOrder ?? -1) + 1

    const newQuestion = await prisma.discussionQuestion.create({
      data: {
        bookId: params.id,
        question: question.trim(),
        sortOrder: newSortOrder
      }
    })

    return NextResponse.json(newQuestion, { status: 201 })
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}

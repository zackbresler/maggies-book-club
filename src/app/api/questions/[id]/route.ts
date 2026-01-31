import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check ownership or admin
  const existing = await prisma.discussionQuestion.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  if (!session.user.isAdmin && existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only edit your own questions' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { question, sortOrder } = body

    const updateData: { question?: string; sortOrder?: number } = {}

    if (question !== undefined) {
      if (question.trim().length === 0) {
        return NextResponse.json(
          { error: 'Question cannot be empty' },
          { status: 400 }
        )
      }
      updateData.question = question.trim()
    }

    if (sortOrder !== undefined) {
      updateData.sortOrder = sortOrder
    }

    const updatedQuestion = await prisma.discussionQuestion.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(updatedQuestion)
  } catch {
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
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

  // Check ownership or admin
  const existing = await prisma.discussionQuestion.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  if (!session.user.isAdmin && existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: 'You can only delete your own questions' },
      { status: 403 }
    )
  }

  try {
    await prisma.discussionQuestion.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Question deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}

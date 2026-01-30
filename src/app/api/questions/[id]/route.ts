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

  if (!session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Only admins can edit discussion questions' },
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
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
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

  if (!session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Only admins can delete discussion questions' },
      { status: 403 }
    )
  }

  try {
    await prisma.discussionQuestion.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Question deleted' })
  } catch {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }
}

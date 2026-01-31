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

  const note = await prisma.bookNote.findUnique({
    where: {
      userId_bookId: {
        userId: session.user.id,
        bookId: params.id
      }
    }
  })

  return NextResponse.json({ note })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      // Delete note if content is empty
      await prisma.bookNote.deleteMany({
        where: {
          userId: session.user.id,
          bookId: params.id
        }
      })
      return NextResponse.json({ note: null })
    }

    const note = await prisma.bookNote.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: params.id
        }
      },
      update: { content: content.trim() },
      create: {
        userId: session.user.id,
        bookId: params.id,
        content: content.trim()
      }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Save note error:', error)
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    )
  }
}

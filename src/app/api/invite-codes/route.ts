import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const inviteCodes = await prisma.inviteCode.findMany({
    include: {
      createdBy: {
        select: { id: true, name: true }
      },
      usedBy: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(inviteCodes)
}

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Generate a unique code
    let code: string
    let exists = true

    while (exists) {
      code = generateInviteCode()
      const existing = await prisma.inviteCode.findUnique({
        where: { code }
      })
      exists = !!existing
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code: code!,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(inviteCode, { status: 201 })
  } catch (error) {
    console.error('Create invite code error:', error)
    return NextResponse.json(
      { error: 'Failed to create invite code' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Invite code ID is required' }, { status: 400 })
  }

  try {
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { id }
    })

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code not found' }, { status: 404 })
    }

    if (inviteCode.usedById) {
      return NextResponse.json(
        { error: 'Cannot delete a used invite code' },
        { status: 400 }
      )
    }

    await prisma.inviteCode.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Invite code deleted' })
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete invite code' },
      { status: 500 }
    )
  }
}

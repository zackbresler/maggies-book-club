import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Nullify discussion questions authored by this user (keep the questions)
  await prisma.discussionQuestion.updateMany({
    where: { userId: params.id },
    data: { userId: null }
  })

  // Nullify invite codes used by this user
  await prisma.inviteCode.updateMany({
    where: { usedById: params.id },
    data: { usedById: null, usedAt: null }
  })

  // Delete invite codes created by this user (that are unused)
  await prisma.inviteCode.deleteMany({
    where: { createdById: params.id, usedById: null }
  })

  // For used invite codes created by this user, we need to reassign createdBy
  // to the admin performing the delete to avoid FK violation
  await prisma.inviteCode.updateMany({
    where: { createdById: params.id },
    data: { createdById: session.user.id }
  })

  // Reassign books added by this user to the admin
  await prisma.book.updateMany({
    where: { addedById: params.id },
    data: { addedById: session.user.id }
  })

  // Vote, Rating, BookNote have onDelete: Cascade, so they'll be cleaned up automatically
  await prisma.user.delete({ where: { id: params.id } })

  return NextResponse.json({ message: `User ${user.name} has been deleted` })
}

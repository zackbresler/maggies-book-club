import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await request.json()

  if (!email || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const trimmed = email.trim().toLowerCase()

  // Check if email is already taken by another user
  const existing = await prisma.user.findUnique({ where: { email: trimmed } })
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: 'Email is already in use' }, { status: 409 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: trimmed }
  })

  return NextResponse.json({ message: 'Email updated successfully' })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get active announcement
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const announcement = await prisma.announcement.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ announcement })
}

// Create or update announcement (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Only admins can manage announcements' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { title, location, dateTime, timeZone, notes } = body

    if (!location || !dateTime) {
      return NextResponse.json(
        { error: 'Location and date/time are required' },
        { status: 400 }
      )
    }

    // Deactivate all existing announcements
    await prisma.announcement.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Create new announcement
    const announcement = await prisma.announcement.create({
      data: {
        title: title || 'Next Book Club Meeting',
        location,
        dateTime,
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: notes || null,
        isActive: true
      }
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Announcement error:', error)
    return NextResponse.json(
      { error: 'Failed to save announcement' },
      { status: 500 }
    )
  }
}

// Delete/deactivate announcement (admin only)
export async function DELETE() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Only admins can manage announcements' },
      { status: 403 }
    )
  }

  await prisma.announcement.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  })

  return NextResponse.json({ message: 'Announcement removed' })
}

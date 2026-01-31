import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Get active announcement
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcement = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Announcement GET error:', error)
    return NextResponse.json({ announcement: null })
  }
}

// Create or update announcement (admin only)
export async function POST(request: Request) {
  try {
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

    const body = await request.json()
    const { title, location, dateTime, timeZone, notes } = body

    if (!location || !dateTime) {
      return NextResponse.json(
        { error: 'Location and date/time are required' },
        { status: 400 }
      )
    }

    // Sanitize inputs - keep only printable ASCII + common whitespace
    const sanitize = (s: string | null | undefined): string | null => {
      if (s == null || s === '') return null
      // Replace smart quotes/dashes with ASCII equivalents, then strip anything non-ASCII
      return s
        .replace(/[\u2018\u2019\u201A\u201B\u0060]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2013\u2014\u2015]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/[^\x20-\x7E\x0A\x0D\x09]/g, '')
    }

    const cleanTitle = sanitize(title) || 'Next Book Club Meeting'
    const cleanLocation = sanitize(location) || ''
    const cleanDateTime = sanitize(dateTime) || ''
    const cleanTimeZone = sanitize(timeZone) || 'America/Chicago'
    const cleanNotes = sanitize(notes)

    // Deactivate all existing announcements
    await prisma.announcement.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Create new announcement (provide ID explicitly to avoid cuid() issues on Alpine)
    const announcement = await prisma.announcement.create({
      data: {
        id: crypto.randomUUID(),
        title: cleanTitle,
        location: cleanLocation,
        dateTime: cleanDateTime,
        timeZone: cleanTimeZone,
        notes: cleanNotes,
        isActive: true
      }
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Announcement POST error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Failed to save announcement: ${message}` },
      { status: 500 }
    )
  }
}

// Delete/deactivate announcement (admin only)
export async function DELETE() {
  try {
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
  } catch (error) {
    console.error('Announcement DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove announcement' },
      { status: 500 }
    )
  }
}

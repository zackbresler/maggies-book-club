import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [users, books, ratings, votes, inviteCodes, discussionQuestions, announcements, siteSettings, bookNotes] =
    await Promise.all([
      prisma.user.findMany(),
      prisma.book.findMany(),
      prisma.rating.findMany(),
      prisma.vote.findMany(),
      prisma.inviteCode.findMany(),
      prisma.discussionQuestion.findMany(),
      prisma.announcement.findMany(),
      prisma.siteSetting.findMany(),
      prisma.bookNote.findMany(),
    ])

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      users,
      books,
      ratings,
      votes,
      inviteCodes,
      discussionQuestions,
      announcements,
      siteSettings,
      bookNotes,
    },
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="bookclub-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const backup = await request.json()

  if (!backup?.version || !backup?.data) {
    return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 })
  }

  const { users, books, ratings, votes, inviteCodes, discussionQuestions, announcements, siteSettings, bookNotes } = backup.data

  // Delete everything in dependency order, then re-insert
  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany()
    await tx.rating.deleteMany()
    await tx.discussionQuestion.deleteMany()
    await tx.bookNote.deleteMany()
    await tx.inviteCode.deleteMany()
    await tx.announcement.deleteMany()
    await tx.book.deleteMany()
    await tx.user.deleteMany()
    await tx.siteSetting.deleteMany()

    if (users?.length) {
      for (const u of users) {
        await tx.user.create({ data: u })
      }
    }
    if (books?.length) {
      for (const b of books) {
        await tx.book.create({ data: b })
      }
    }
    if (ratings?.length) {
      for (const r of ratings) {
        await tx.rating.create({ data: r })
      }
    }
    if (votes?.length) {
      for (const v of votes) {
        await tx.vote.create({ data: v })
      }
    }
    if (inviteCodes?.length) {
      for (const ic of inviteCodes) {
        await tx.inviteCode.create({ data: ic })
      }
    }
    if (discussionQuestions?.length) {
      for (const dq of discussionQuestions) {
        await tx.discussionQuestion.create({ data: dq })
      }
    }
    if (announcements?.length) {
      for (const a of announcements) {
        await tx.announcement.create({ data: a })
      }
    }
    if (siteSettings?.length) {
      for (const s of siteSettings) {
        await tx.siteSetting.create({ data: s })
      }
    }
    if (bookNotes?.length) {
      for (const bn of bookNotes) {
        await tx.bookNote.create({ data: bn })
      }
    }
  })

  return NextResponse.json({ message: 'Backup restored successfully' })
}

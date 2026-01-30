import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (key) {
    const setting = await prisma.siteSetting.findUnique({ where: { key } })
    return NextResponse.json({ value: setting?.value ?? null })
  }

  const settings = await prisma.siteSetting.findMany()
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await request.json()
  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 })
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  return NextResponse.json(setting)
}

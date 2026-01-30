import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { isAdmin: true }
  })

  if (existingAdmin) {
    console.log('Admin user already exists:', existingAdmin.email)
    return
  }

  // Create admin user (Maggie)
  const adminEmail = process.env.ADMIN_EMAIL || 'maggie@bookclub.local'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'
  const adminName = process.env.ADMIN_NAME || 'Maggie'

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      isAdmin: true
    }
  })

  console.log('Created admin user:', admin.email)

  // Create an initial invite code
  const inviteCode = await prisma.inviteCode.create({
    data: {
      code: 'WELCOME1',
      createdById: admin.id
    }
  })

  console.log('Created initial invite code:', inviteCode.code)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

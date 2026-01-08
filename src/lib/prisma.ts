// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../generated/prisma/client')

type PrismaClientType = InstanceType<typeof PrismaClient>

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType }

export const prisma: PrismaClientType = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

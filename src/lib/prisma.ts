import { neonConfig, Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@/generated/prisma'
import ws from 'ws'

// Required for Node.js environments
neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL!

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

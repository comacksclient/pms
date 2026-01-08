import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// Define UserRole type locally to avoid import issues
type UserRole = 'SUPERADMIN' | 'ADMIN' | 'DOCTOR' | 'STAFF'

export async function getCurrentUser() {
    const { userId } = await auth()

    if (!userId) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { clinic: true },
    })

    return user
}

export async function requireAuth() {
    const user = await getCurrentUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    return user
}

export async function requireRole(allowedRoles: UserRole[]) {
    const user = await requireAuth()

    if (!allowedRoles.includes(user.role as UserRole)) {
        throw new Error('Forbidden: Insufficient permissions')
    }

    return user
}

export async function requireClinic() {
    const user = await requireAuth()

    if (!user.clinicId) {
        throw new Error('No clinic associated with user')
    }

    return { user, clinicId: user.clinicId }
}

// Role check helpers
export function canManageClinic(role: UserRole): boolean {
    return ['SUPERADMIN', 'ADMIN'].includes(role)
}

export function canManageTreatments(role: UserRole): boolean {
    return ['SUPERADMIN', 'ADMIN'].includes(role)
}

export function canViewPatients(role: UserRole): boolean {
    return ['SUPERADMIN', 'ADMIN', 'DOCTOR', 'STAFF'].includes(role)
}

export function canEditClinicalRecords(role: UserRole): boolean {
    return ['SUPERADMIN', 'ADMIN', 'DOCTOR'].includes(role)
}

export function canDeleteClinicalRecords(role: UserRole): boolean {
    return ['SUPERADMIN', 'ADMIN', 'DOCTOR'].includes(role)
}

export function canManageBilling(role: UserRole): boolean {
    return ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(role)
}

export function canViewAnalytics(role: UserRole): boolean {
    return ['SUPERADMIN', 'ADMIN'].includes(role)
}

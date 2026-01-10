"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import type { AppointmentFormValues } from "@/lib/validations/appointment"

export async function getAppointments(
    clinicId: string,
    options?: {
        date?: Date
        startDate?: Date
        endDate?: Date
        doctorId?: string
        status?: string
    }
) {
    const { date, startDate, endDate, doctorId, status } = options || {}

    let rangeStart: Date | undefined
    let rangeEnd: Date | undefined

    if (date) {
        // Single day filter
        const queryDate = new Date(date)
        rangeStart = new Date(queryDate)
        rangeStart.setHours(0, 0, 0, 0)

        rangeEnd = new Date(queryDate)
        rangeEnd.setHours(23, 59, 59, 999)
    } else if (startDate && endDate) {
        // Range filter
        rangeStart = new Date(startDate)
        rangeStart.setHours(0, 0, 0, 0)

        rangeEnd = new Date(endDate)
        rangeEnd.setHours(23, 59, 59, 999)
    }

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            ...(rangeStart && rangeEnd && {
                scheduledAt: {
                    gte: rangeStart,
                    lte: rangeEnd,
                },
            }),
            ...(doctorId && { doctorId }),
            ...(status && { status: status as "SCHEDULED" | "CONFIRMED" | "SEATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" }),
        },
        include: {
            patient: true,
            doctor: true,
        },
        orderBy: { scheduledAt: "asc" },
    })

    return appointments
}

export async function createAppointment(
    clinicId: string,
    data: AppointmentFormValues
) {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    const appointment = await prisma.appointment.create({
        data: {
            ...data,
            clinicId,
            doctorId: user.id, // Auto-assign current user
            status: "SCHEDULED",
        },
        include: {
            patient: true,
            doctor: true,
        },
    })

    revalidatePath("/schedule")
    return appointment
}

export async function updateAppointmentStatus(
    id: string,
    status: "SCHEDULED" | "CONFIRMED" | "SEATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
) {
    const appointment = await prisma.appointment.update({
        where: { id },
        data: { status },
    })

    // Update patient's last visit date if completed
    if (status === "COMPLETED") {
        await prisma.patient.update({
            where: { id: appointment.patientId },
            data: { lastVisitDate: new Date() },
        })
    }

    revalidatePath("/schedule")
    return appointment
}

export async function getUpcomingAppointments(clinicId: string, limit = 5) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: { gte: today },
            status: { in: ["SCHEDULED", "CONFIRMED", "SEATED"] },
        },
        include: {
            patient: true,
            doctor: true,
        },
        orderBy: { scheduledAt: "asc" },
        take: limit,
    })

    return appointments
}

export async function getTodayAppointments(clinicId: string) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            patient: true,
            doctor: true,
        },
        orderBy: { scheduledAt: "asc" },
    })

    return appointments
}

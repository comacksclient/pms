"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { AppointmentFormValues } from "@/lib/validations/appointment"

export async function getAppointments(
    clinicId: string,
    options?: {
        date?: Date
        doctorId?: string
        status?: string
    }
) {
    const { date, doctorId, status } = options || {}

    const startOfDay = date ? new Date(date.setHours(0, 0, 0, 0)) : undefined
    const endOfDay = date ? new Date(date.setHours(23, 59, 59, 999)) : undefined

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            ...(startOfDay && endOfDay && {
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
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
    const appointment = await prisma.appointment.create({
        data: {
            ...data,
            clinicId,
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
    const now = new Date()

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: { gte: now },
            status: { in: ["SCHEDULED", "CONFIRMED"] },
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

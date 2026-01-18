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
    const { doctorId, status, startDate, endDate } = options || {}


    const defaultStart = startDate || new Date(new Date().setDate(new Date().getDate() - 30))
    const defaultEnd = endDate || new Date(new Date().setDate(new Date().getDate() + 30))

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: {
                gte: defaultStart,
                lte: defaultEnd,
            },
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
    revalidatePath("/") // Dashboard
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
    revalidatePath("/") // Dashboard
    return appointment
}

export async function getUpcomingAppointments(clinicId: string, limit = 5) {
    const now = new Date()

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: { gte: now },
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

// Update appointment details (date, time, type, notes, duration)
export async function updateAppointment(
    id: string,
    data: {
        scheduledAt?: Date
        type?: string
        notes?: string
        duration?: number
        doctorId?: string
    }
) {
    // Build update object only with defined values
    const updateData: any = {}
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt
    if (data.type !== undefined) updateData.type = data.type
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.doctorId !== undefined) {
        updateData.doctor = { connect: { id: data.doctorId } }
    }

    const appointment = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
            patient: true,
            doctor: true,
        },
    })

    revalidatePath("/schedule")
    revalidatePath(`/patients/${appointment.patientId}`)
    revalidatePath("/") // Dashboard
    return appointment
}

// Get all appointments for a specific patient
export async function getPatientAppointments(patientId: string) {
    const appointments = await prisma.appointment.findMany({
        where: { patientId },
        include: {
            doctor: true,
        },
        orderBy: { scheduledAt: "desc" },
    })

    return appointments
}

// Delete/Cancel appointment
export async function deleteAppointment(id: string) {
    const appointment = await prisma.appointment.delete({
        where: { id },
    })

    revalidatePath("/schedule")
    revalidatePath(`/patients/${appointment.patientId}`)
    revalidatePath("/")
    return appointment
}

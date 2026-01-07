"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { PatientFormValues } from "@/lib/validations/patient"

export async function getPatients(clinicId: string, query?: string) {
    const patients = await prisma.patient.findMany({
        where: {
            clinicId,
            ...(query && {
                OR: [
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } },
                    { phone: { contains: query } },
                ],
            }),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    })
    return patients
}

export async function getPatientById(id: string) {
    const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
            appointments: {
                orderBy: { scheduledAt: "desc" },
                take: 10,
                include: {
                    doctor: true,
                },
            },
            invoices: {
                orderBy: { createdAt: "desc" },
                take: 5,
            },
        },
    })
    return patient
}

export async function createPatient(clinicId: string, data: PatientFormValues) {
    const patient = await prisma.patient.create({
        data: {
            ...data,
            clinicId,
            email: data.email || null,
        },
    })

    revalidatePath("/patients")
    return patient
}

export async function updatePatient(id: string, data: Partial<PatientFormValues>) {
    const patient = await prisma.patient.update({
        where: { id },
        data: {
            ...data,
            email: data.email || null,
        },
    })

    revalidatePath("/patients")
    revalidatePath(`/patients/${id}`)
    return patient
}

export async function deletePatient(id: string) {
    await prisma.patient.delete({
        where: { id },
    })

    revalidatePath("/patients")
}

export async function updateLastVisitDate(patientId: string) {
    await prisma.patient.update({
        where: { id: patientId },
        data: { lastVisitDate: new Date() },
    })
}

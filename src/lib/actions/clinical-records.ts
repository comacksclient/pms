"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { ClinicalRecordFormValues } from "@/lib/validations/treatment"

export async function getClinicalRecords(patientId: string) {
    const records = await prisma.clinicalRecord.findMany({
        where: { patientId },
        include: {
            procedure: true,
            appointment: true,
            createdBy: true,
        },
        orderBy: { createdAt: "desc" },
    })

    return records
}

export async function getClinicalRecordsByAppointment(appointmentId: string) {
    const records = await prisma.clinicalRecord.findMany({
        where: { appointmentId },
        include: {
            procedure: true,
            createdBy: true,
        },
        orderBy: { createdAt: "asc" },
    })

    return records
}

export async function createClinicalRecord(
    userId: string,
    data: ClinicalRecordFormValues
) {
    // Get the procedure to get the standard cost
    const procedure = await prisma.treatmentCatalog.findUnique({
        where: { id: data.procedureId },
    })

    if (!procedure) {
        throw new Error("Treatment not found")
    }

    const record = await prisma.clinicalRecord.create({
        data: {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            procedureId: data.procedureId,
            toothNumber: data.toothNumber,
            surface: data.surface,
            diagnosis: data.diagnosis,
            notes: data.notes,
            costOverride: data.costOverride,
            createdById: userId,
        },
        include: {
            procedure: true,
        },
    })

    // Create audit log if cost was overridden
    if (data.costOverride && data.costOverride !== Number(procedure.standardCost)) {
        await prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entityType: "ClinicalRecord",
                entityId: record.id,
                oldValue: { cost: Number(procedure.standardCost) },
                newValue: { cost: data.costOverride },
                reason: "Manual price override",
                userId,
            },
        })
    }

    revalidatePath(`/patients/${data.patientId}`)
    return record
}

export async function updateClinicalRecord(
    id: string,
    userId: string,
    data: Partial<ClinicalRecordFormValues>
) {
    const existingRecord = await prisma.clinicalRecord.findUnique({
        where: { id },
        include: { procedure: true },
    })

    if (!existingRecord) {
        throw new Error("Clinical record not found")
    }

    const record = await prisma.clinicalRecord.update({
        where: { id },
        data: {
            toothNumber: data.toothNumber,
            surface: data.surface,
            diagnosis: data.diagnosis,
            notes: data.notes,
            costOverride: data.costOverride,
        },
    })

    // Log cost override changes
    if (
        data.costOverride !== undefined &&
        data.costOverride !== Number(existingRecord.costOverride)
    ) {
        await prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entityType: "ClinicalRecord",
                entityId: record.id,
                oldValue: { cost: Number(existingRecord.costOverride || existingRecord.procedure.standardCost) },
                newValue: { cost: data.costOverride },
                reason: "Price override updated",
                userId,
            },
        })
    }

    revalidatePath(`/patients/${record.patientId}`)
    return record
}

export async function deleteClinicalRecord(id: string, userId: string) {
    const record = await prisma.clinicalRecord.findUnique({
        where: { id },
    })

    if (!record) {
        throw new Error("Clinical record not found")
    }

    await prisma.auditLog.create({
        data: {
            action: "DELETE",
            entityType: "ClinicalRecord",
            entityId: id,
            oldValue: record as object,
            userId,
        },
    })

    await prisma.clinicalRecord.delete({
        where: { id },
    })

    revalidatePath(`/patients/${record.patientId}`)
}

export async function getToothHistory(patientId: string, toothNumber: string) {
    const records = await prisma.clinicalRecord.findMany({
        where: {
            patientId,
            toothNumber,
        },
        include: {
            procedure: true,
            appointment: true,
        },
        orderBy: { createdAt: "desc" },
    })

    return records
}

"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { TreatmentFormValues } from "@/lib/validations/treatment"

export async function getTreatments(clinicId: string, category?: string) {
    const treatments = await prisma.treatmentCatalog.findMany({
        where: {
            clinicId,
            ...(category && { category }),
            isActive: true,
        },
        orderBy: { category: "asc" },
    })
    return treatments
}

export async function getAllTreatments(clinicId: string) {
    const treatments = await prisma.treatmentCatalog.findMany({
        where: { clinicId },
        orderBy: [{ category: "asc" }, { name: "asc" }],
    })
    return treatments
}

export async function createTreatment(clinicId: string, data: TreatmentFormValues) {
    const treatment = await prisma.treatmentCatalog.create({
        data: {
            ...data,
            clinicId,
            standardCost: data.standardCost,
        },
    })

    revalidatePath("/settings/treatments")
    return treatment
}

export async function updateTreatment(id: string, data: Partial<TreatmentFormValues>) {
    const treatment = await prisma.treatmentCatalog.update({
        where: { id },
        data: {
            ...data,
            ...(data.standardCost !== undefined && { standardCost: data.standardCost }),
        },
    })

    revalidatePath("/settings/treatments")
    return treatment
}

export async function deleteTreatment(id: string) {
    // Soft delete by setting isActive to false
    await prisma.treatmentCatalog.update({
        where: { id },
        data: { isActive: false },
    })

    revalidatePath("/settings/treatments")
}

export async function getTreatmentCategories(clinicId: string) {
    const treatments = await prisma.treatmentCatalog.findMany({
        where: { clinicId, isActive: true },
        select: { category: true },
        distinct: ["category"],
    })
    return treatments.map((t: { category: string }) => t.category)
}

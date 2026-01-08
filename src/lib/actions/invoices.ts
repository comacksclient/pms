"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { CreateInvoiceValues, PaymentFormValues } from "@/lib/validations/invoice"
import { generateInvoiceNumber } from "@/lib/utils"

export async function getInvoices(
    clinicId: string,
    options?: {
        patientId?: string
        status?: string
        limit?: number
    }
) {
    const { patientId, status, limit } = options || {}

    const invoices = await prisma.invoice.findMany({
        where: {
            clinicId,
            ...(patientId && { patientId }),
            ...(status && { status: status as "DRAFT" | "PENDING" | "PARTIAL" | "PAID" | "CANCELLED" | "REFUNDED" }),
        },
        include: {
            patient: true,
            items: true,
            payments: true,
        },
        orderBy: { createdAt: "desc" },
        ...(limit && { take: limit }),
    })

    return invoices
}

export async function getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            patient: true,
            appointment: true,
            items: {
                include: {
                    clinicalRecord: {
                        include: {
                            procedure: true,
                        },
                    },
                },
            },
            payments: true,
        },
    })

    return invoice
}

export async function createInvoice(clinicId: string, data: CreateInvoiceValues) {
    const subtotal = data.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
    )

    let discount = data.discount || 0
    if (data.discountType === "percentage") {
        discount = (subtotal * discount) / 100
    }

    const tax = data.tax || 0
    const total = subtotal - discount + tax

    const invoice = await prisma.invoice.create({
        data: {
            invoiceNumber: generateInvoiceNumber(),
            patientId: data.patientId,
            appointmentId: data.appointmentId,
            clinicId,
            subtotal,
            discount,
            discountType: data.discountType,
            tax,
            total,
            status: "PENDING",
            dueDate: data.dueDate,
            notes: data.notes,
            items: {
                create: data.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.unitPrice * item.quantity,
                    clinicalRecordId: item.clinicalRecordId,
                })),
            },
        },
        include: {
            items: true,
        },
    })

    revalidatePath("/billing")
    return invoice
}

export async function recordPayment(data: PaymentFormValues) {
    const payment = await prisma.payment.create({
        data: {
            invoiceId: data.invoiceId,
            amount: data.amount,
            method: data.method as "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "INSURANCE" | "OTHER",
            reference: data.reference,
            notes: data.notes,
        },
    })

    // Update invoice
    const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { payments: true },
    })

    if (invoice) {
        const totalPaid = invoice.payments.reduce(
            (sum: number, p: { amount: unknown }) => sum + Number(p.amount),
            Number(data.amount)
        )

        const status = totalPaid >= Number(invoice.total) ? "PAID" : "PARTIAL"

        await prisma.invoice.update({
            where: { id: data.invoiceId },
            data: {
                amountPaid: totalPaid,
                status,
            },
        })
    }

    revalidatePath("/billing")
    return payment
}

export async function generateInvoiceFromAppointment(
    appointmentId: string,
    clinicId: string
) {
    // Get clinical records from the appointment
    const clinicalRecords = await prisma.clinicalRecord.findMany({
        where: { appointmentId },
        include: { procedure: true },
    })

    if (clinicalRecords.length === 0) {
        throw new Error("No treatments found for this appointment")
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
    })

    if (!appointment) {
        throw new Error("Appointment not found")
    }

    // Create invoice items from clinical records
    type ClinicalRecordWithProcedure = typeof clinicalRecords[number]
    const items = clinicalRecords.map((record: ClinicalRecordWithProcedure) => ({
        description: `${record.procedure.name}${record.toothNumber ? ` (Tooth ${record.toothNumber})` : ""}`,
        quantity: 1,
        unitPrice: Number(record.costOverride || record.procedure.standardCost),
        clinicalRecordId: record.id,
    }))

    const invoice = await createInvoice(clinicId, {
        patientId: appointment.patientId,
        appointmentId,
        items,
        discount: 0,
        tax: 0,
    })

    return invoice
}

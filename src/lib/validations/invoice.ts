import { z } from 'zod'

export const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1).default(1),
    unitPrice: z.number().min(0),
    clinicalRecordId: z.string().uuid().optional(),
})

export const createInvoiceSchema = z.object({
    patientId: z.string().uuid(),
    appointmentId: z.string().uuid().optional(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
    discount: z.number().min(0).default(0),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    tax: z.number().min(0).default(0),
    notes: z.string().max(500).optional(),
    dueDate: z.date().optional(),
})

export type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>

export const paymentFormSchema = z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    method: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'INSURANCE', 'OTHER']),
    reference: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
})

export type PaymentFormValues = z.infer<typeof paymentFormSchema>

export const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'OTHER', label: 'Other' },
] as const

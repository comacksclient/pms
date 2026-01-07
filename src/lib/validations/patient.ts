import { z } from 'zod'

export const patientFormSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
    dateOfBirth: z.coerce.date({ message: 'Date of birth is required' }),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    address: z.string().max(200).optional(),
    allergies: z.array(z.string()).default([]),
    notes: z.string().max(500).optional(),
})

export type PatientFormValues = z.infer<typeof patientFormSchema>

export const patientSearchSchema = z.object({
    query: z.string().optional(),
    page: z.number().default(1),
    limit: z.number().default(10),
})

export type PatientSearchParams = z.infer<typeof patientSearchSchema>

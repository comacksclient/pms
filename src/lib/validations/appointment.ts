import { z } from "zod"

export const appointmentFormSchema = z.object({
    patientId: z.string()
        .min(1, "Please select a patient"),

    scheduledAt: z.union([z.string(), z.date()])
        .refine((val) => {
            const date = typeof val === "string" ? new Date(val) : val
            return date instanceof Date && !isNaN(date.getTime())
        }, "Please enter a valid date and time")
        .refine((val) => {
            const date = typeof val === "string" ? new Date(val) : val
            // Can't schedule appointments more than 1 year in advance
            const oneYearFromNow = new Date()
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
            return date <= oneYearFromNow
        }, "Cannot schedule more than 1 year in advance"),

    duration: z.number()
        .min(15, "Duration must be at least 15 minutes")
        .max(480, "Duration cannot exceed 8 hours")
        .default(30),

    type: z.string()
        .min(1, "Treatment type is required")
        .default("General Consultation"),

    chiefComplaint: z.string()
        .max(500, "Chief complaint is too long")
        .optional()
        .transform((val) => val?.trim()),

    notes: z.string()
        .max(1000, "Notes are too long")
        .optional()
        .transform((val) => val?.trim()),
})

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>

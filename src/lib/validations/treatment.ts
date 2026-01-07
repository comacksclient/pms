import { z } from 'zod'

export const treatmentFormSchema = z.object({
    code: z.string().max(20).optional(),
    name: z.string().min(1, 'Treatment name is required').max(100),
    description: z.string().max(500).optional(),
    standardCost: z.number().min(0, 'Cost must be positive'),
    category: z.string().min(1, 'Category is required'),
    duration: z.number().min(5).max(480).optional(),
    isActive: z.boolean().default(true),
})

export type TreatmentFormValues = z.infer<typeof treatmentFormSchema>

export const clinicalRecordFormSchema = z.object({
    appointmentId: z.string().uuid(),
    patientId: z.string().uuid(),
    procedureId: z.string().uuid('Please select a treatment'),
    toothNumber: z.string().max(3).optional(),
    surface: z.string().max(10).optional(),
    diagnosis: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    costOverride: z.number().min(0).optional(),
})

export type ClinicalRecordFormValues = z.infer<typeof clinicalRecordFormSchema>

export const TREATMENT_CATEGORIES = [
    'Preventive',
    'Restorative',
    'Endodontic',
    'Periodontic',
    'Prosthodontic',
    'Orthodontic',
    'Oral Surgery',
    'Cosmetic',
    'Diagnostic',
    'Emergency',
] as const

export const TOOTH_SURFACES = [
    { value: 'O', label: 'Occlusal' },
    { value: 'M', label: 'Mesial' },
    { value: 'D', label: 'Distal' },
    { value: 'B', label: 'Buccal' },
    { value: 'L', label: 'Lingual' },
    { value: 'I', label: 'Incisal' },
    { value: 'MOD', label: 'MOD' },
    { value: 'DO', label: 'DO' },
    { value: 'MO', label: 'MO' },
] as const

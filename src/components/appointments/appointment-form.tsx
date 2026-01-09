"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appointmentFormSchema, type AppointmentFormValues } from "@/lib/validations/appointment"
import { getPatients } from "@/lib/actions/patients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Doctor {
    id: string
    firstName: string
    lastName: string
}

interface Patient {
    id: string
    firstName: string
    lastName: string
}

interface AppointmentFormProps {
    clinicId: string
    patients: Patient[]
    defaultValues?: Partial<AppointmentFormValues>
    onSubmit: (data: AppointmentFormValues) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export function AppointmentForm({
    clinicId,
    patients,
    defaultValues,
    onSubmit,
    onCancel,
    isLoading,
}: AppointmentFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentFormSchema) as any,
        defaultValues: {
            type: "CHECKUP",
            ...defaultValues,
        },
    })

    const [searchTerm, setSearchTerm] = useState("")
    const [patientList, setPatientList] = useState(patients)
    const [isSearching, setIsSearching] = useState(false)

    // Update patientList when initial patients prop changes (e.g. reload)
    useEffect(() => {
        if (!searchTerm) {
            setPatientList(patients)
        }
    }, [patients]) // Removed searchTerm dependency to avoid overwrite during typing

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (!searchTerm) {
                setPatientList(patients)
                return
            }

            try {
                setIsSearching(true)
                const results = await getPatients(clinicId, searchTerm)
                setPatientList(results.map((p: any) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName })))
            } catch (error) {
                console.error("Search failed", error)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, clinicId, patients])

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="patientId">Patient *</Label>
                    <Input
                        placeholder="Search patient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-2"
                    />
                    <select
                        id="patientId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...register("patientId")}
                    >
                        <option value="">
                            {isSearching ? "Searching..." : `Select Patient (${patientList.length})`}
                        </option>
                        {patientList.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                                {patient.firstName} {patient.lastName}
                            </option>
                        ))}
                    </select>
                    {patientList.length === 0 && !isSearching && (
                        <p className="text-xs text-muted-foreground mt-1">No patients found. Access Patients page to add one.</p>
                    )}
                    {errors.patientId && (
                        <p className="text-sm text-destructive">{errors.patientId.message}</p>
                    )}
                </div>

                {/* Doctor field removed - auto-assigned */}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Date & Time *</Label>
                    <Input
                        id="scheduledAt"
                        type="datetime-local"
                        {...register("scheduledAt", { valueAsDate: true })}
                    />
                    {errors.scheduledAt && (
                        <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="duration">Duration (mins) *</Label>
                    <select
                        id="duration"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...register("duration", { valueAsNumber: true })}
                    >
                        <option value="15">15 mins</option>
                        <option value="30">30 mins</option>
                        <option value="45">45 mins</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                    </select>
                    {errors.duration && (
                        <p className="text-sm text-destructive">{errors.duration.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register("type")}
                >
                    <option value="CHECKUP">General Checkup</option>
                    <option value="TREATMENT">Treatment</option>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="EMERGENCY">Emergency</option>
                </select>
                {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                    id="notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Reason for visit..."
                    {...register("notes")}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues ? "Update Appointment" : "Schedule Appointment"}
                </Button>
            </div>
        </form>
    )
}

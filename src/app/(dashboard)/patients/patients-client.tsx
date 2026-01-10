"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { PatientTable } from "@/components/patients/patient-table"
import { QuickAddPatientSheet } from "@/components/patients/quick-add-sheet"
import { createPatient, updatePatient, deletePatient } from "@/lib/actions/patients"
import type { PatientFormValues } from "@/lib/validations/patient"
import { Button } from "@/components/ui/button"
import { ImportPatientsDialog } from "@/components/patients/import-patients-dialog"
import { ExportPatientsDialog } from "@/components/patients/export-patients-dialog"
import { useToast } from "@/hooks/use-toast"

interface PatientsClientProps {
    initialPatients: any[] // Using any for brevity in migration, ideally Typed
    clinicId: string
}

export function PatientsClient({ initialPatients, clinicId }: PatientsClientProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
    const [patients, setPatients] = useState(initialPatients)
    const [selectedPatient, setSelectedPatient] = useState<any>(null)

    const handleSheetSubmit = async (data: PatientFormValues) => {
        try {
            if (selectedPatient) {
                // Edit Mode
                await updatePatient(selectedPatient.id, data)
                toast({ title: "Patient updated successfully" })
            } else {
                // Create Mode
                await createPatient(clinicId, data)
                toast({ title: "Patient created successfully" })
            }
            router.refresh()
            setIsAddSheetOpen(false)
            setSelectedPatient(null)
        } catch (error) {
            console.error("Failed to save patient", error)
            toast({
                title: "Error",
                description: "Failed to save patient details.",
                variant: "destructive"
            })
        }
    }

    const handleAddClick = () => {
        setSelectedPatient(null)
        setIsAddSheetOpen(true)
    }

    const handleViewPatient = (patient: { id: string }) => {
        router.push(`/patients/${patient.id}`)
    }

    const handleEditPatient = (patient: any) => {
        // Pre-fill date objects if needed, though react-hook-form handles strings well for defaultValues usually
        // But date input needs YYYY-MM-DD
        const formattedPatient = {
            ...patient,
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : "",
        }
        setSelectedPatient(formattedPatient)
        setIsAddSheetOpen(true)
    }

    const handleDeletePatient = async (patient: any) => {
        if (confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}? This action cannot be undone.`)) {
            try {
                await deletePatient(patient.id)
                toast({ title: "Patient deleted successfully" })
                router.refresh()
            } catch (error) {
                console.error("Delete failed", error)
                toast({ title: "Delete failed", variant: "destructive" })
            }
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Patients"
                description="Manage your patient records"
                action={{
                    label: "Add Patient",
                    onClick: handleAddClick,
                }}
            >
                <div className="flex items-center gap-2">
                    <ImportPatientsDialog clinicId={clinicId} />
                    <ExportPatientsDialog clinicId={clinicId} />
                </div>
            </Header>

            <div className="flex-1 p-6">
                <PatientTable
                    patients={patients}
                    onView={handleViewPatient}
                    onEdit={handleEditPatient}
                    onDelete={handleDeletePatient}
                />
            </div>

            <QuickAddPatientSheet
                open={isAddSheetOpen}
                onOpenChange={(open) => {
                    setIsAddSheetOpen(open)
                    if (!open) setSelectedPatient(null)
                }}
                onSubmit={handleSheetSubmit}
                defaultValues={selectedPatient}
            />
        </div>
    )
}

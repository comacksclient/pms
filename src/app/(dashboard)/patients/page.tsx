"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { PatientTable } from "@/components/patients/patient-table"
import { QuickAddPatientSheet } from "@/components/patients/quick-add-sheet"
import type { PatientFormValues } from "@/lib/validations/patient"

interface MockPatient {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string | null
    dateOfBirth: Date
    gender?: string | null
    lastVisitDate?: Date | null
}

// Mock data for demonstration
const mockPatients: MockPatient[] = [
    {
        id: "1",
        firstName: "Rahul",
        lastName: "Sharma",
        phone: "+91 98765 43210",
        email: "rahul.sharma@email.com",
        dateOfBirth: new Date("1985-03-15"),
        gender: "Male",
        lastVisitDate: new Date("2024-01-05"),
    },
    {
        id: "2",
        firstName: "Priya",
        lastName: "Patel",
        phone: "+91 98765 43211",
        email: "priya.patel@email.com",
        dateOfBirth: new Date("1992-07-22"),
        gender: "Female",
        lastVisitDate: new Date("2024-01-03"),
    },
    {
        id: "3",
        firstName: "Amit",
        lastName: "Kumar",
        phone: "+91 98765 43212",
        email: null,
        dateOfBirth: new Date("1978-11-08"),
        gender: "Male",
        lastVisitDate: null,
    },
    {
        id: "4",
        firstName: "Sneha",
        lastName: "Gupta",
        phone: "+91 98765 43213",
        email: "sneha.gupta@email.com",
        dateOfBirth: new Date("1995-05-30"),
        gender: "Female",
        lastVisitDate: new Date("2024-01-06"),
    },
    {
        id: "5",
        firstName: "Vikram",
        lastName: "Singh",
        phone: "+91 98765 43214",
        email: "vikram.singh@email.com",
        dateOfBirth: new Date("1988-09-12"),
        gender: "Male",
        lastVisitDate: new Date("2023-12-20"),
    },
]

export default function PatientsPage() {
    const router = useRouter()
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
    const [patients, setPatients] = useState<MockPatient[]>(mockPatients)

    const handleAddPatient = async (data: PatientFormValues) => {
        // In real app, this would call the server action
        const newPatient: MockPatient = {
            id: String(patients.length + 1),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email || null,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender || null,
            lastVisitDate: null,
        }
        setPatients([newPatient, ...patients])
    }

    const handleViewPatient = (patient: { id: string }) => {
        router.push(`/patients/${patient.id}`)
    }

    const handleEditPatient = (patient: { id: string }) => {
        // Open edit modal or navigate to edit page
        console.log("Edit patient:", patient.id)
    }

    const handleDeletePatient = (patient: { id: string }) => {
        // In real app, show confirmation dialog and call server action
        setPatients(patients.filter((p) => p.id !== patient.id))
    }

    return (
        <div className="flex flex-col">
            <Header
                title="Patients"
                description="Manage your patient records"
                action={{
                    label: "Add Patient",
                    onClick: () => setIsAddSheetOpen(true),
                }}
            />

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
                onOpenChange={setIsAddSheetOpen}
                onSubmit={handleAddPatient}
            />
        </div>
    )
}

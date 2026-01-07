"use client"

import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { PatientForm } from "./patient-form"
import type { PatientFormValues } from "@/lib/validations/patient"

interface QuickAddPatientSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: PatientFormValues) => Promise<void>
}

export function QuickAddPatientSheet({
    open,
    onOpenChange,
    onSubmit,
}: QuickAddPatientSheetProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: PatientFormValues) => {
        setIsLoading(true)
        try {
            await onSubmit(data)
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to create patient:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Patient</SheetTitle>
                    <SheetDescription>
                        Fill in the patient details below. Required fields are marked with *.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    <PatientForm
                        onSubmit={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        isLoading={isLoading}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}

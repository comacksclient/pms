"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Patient {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
    dateOfBirth: Date
}

interface PatientContextType {
    activePatient: Patient | null
    setActivePatient: (patient: Patient | null) => void
    clearActivePatient: () => void
}

const PatientContext = createContext<PatientContextType | undefined>(undefined)

interface PatientProviderProps {
    children: ReactNode
}

export function PatientProvider({ children }: PatientProviderProps) {
    const [activePatient, setActivePatient] = useState<Patient | null>(null)

    const clearActivePatient = () => setActivePatient(null)

    return (
        <PatientContext.Provider
            value={{
                activePatient,
                setActivePatient,
                clearActivePatient,
            }}
        >
            {children}
        </PatientContext.Provider>
    )
}

export function usePatient() {
    const context = useContext(PatientContext)
    if (context === undefined) {
        throw new Error("usePatient must be used within a PatientProvider")
    }
    return context
}

"use client"

import { useForm, SubmitHandler, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { patientFormSchema, type PatientFormValues } from "@/lib/validations/patient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface PatientFormProps {
    defaultValues?: Partial<PatientFormValues>
    onSubmit: (data: PatientFormValues) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export function PatientForm({
    defaultValues,
    onSubmit,
    onCancel,
    isLoading,
}: PatientFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(patientFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            gender: undefined,
            address: "",
            allergies: [] as string[],
            notes: "",
            ...defaultValues,
        },
    })

    const handleFormSubmit: SubmitHandler<FieldValues> = async (data) => {
        await onSubmit(data as PatientFormValues)
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                        id="firstName"
                        placeholder="John"
                        {...register("firstName")}
                    />
                    {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName.message as string}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                        id="lastName"
                        placeholder="Doe"
                        {...register("lastName")}
                    />
                    {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName.message as string}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        {...register("phone")}
                    />
                    {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message as string}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message as string}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                        id="dateOfBirth"
                        type="date"
                        {...register("dateOfBirth")}
                    />
                    {errors.dateOfBirth && (
                        <p className="text-sm text-destructive">{errors.dateOfBirth.message as string}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                        id="gender"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...register("gender")}
                    >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    placeholder="123 Main Street, City"
                    {...register("address")}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                    id="notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Any additional notes about the patient..."
                    {...register("notes")}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues?.firstName ? "Update Patient" : "Add Patient"}
                </Button>
            </div>
        </form>
    )
}

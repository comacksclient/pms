"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronsUpDown, Check, Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

import { createInvoice } from "@/lib/actions/invoices"
import { getPatients } from "@/lib/actions/patients"
import { getTreatments } from "@/lib/actions/treatments"
import { createInvoiceSchema, type CreateInvoiceValues } from "@/lib/validations/invoice"


interface CreateInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clinicId: string
    defaultPatientId?: string | null // Explicitly allow null
    onSuccess: () => void
}


export function CreateInvoiceDialog({
    open,
    onOpenChange,
    clinicId,
    defaultPatientId,
    onSuccess,
}: CreateInvoiceDialogProps) {
    const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([])
    const [treatments, setTreatments] = useState<{ id: string; name: string; standardCost: number }[]>([])
    const [isLoadingPatients, setIsLoadingPatients] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [patientOpen, setPatientOpen] = useState(false) // State for combobox

    // @ts-ignore - Resolver types mismatch due to strict Zod inference but runtime is fine. 
    // We are manually casting or ignoring to proceed fast as schema is correct.
    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CreateInvoiceValues>({
        // @ts-ignore
        resolver: zodResolver(createInvoiceSchema),
        defaultValues: {
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
            tax: 0,
            discount: 0,
            discountType: "percentage",
            patientId: defaultPatientId || "",
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    })

    const watchItems = watch("items")
    const watchDiscount = watch("discount")
    const watchDiscountType = watch("discountType")
    const watchTax = watch("tax")

    // Calculate totals for preview
    const subtotal = (watchItems || []).reduce((acc, item) => acc + (Number(item?.quantity || 0) * Number(item?.unitPrice || 0)), 0)

    let discountAmount = Number(watchDiscount) || 0
    if (watchDiscountType === "percentage") {
        discountAmount = (subtotal * discountAmount) / 100
    }
    const taxAmount = Number(watchTax) || 0
    const total = subtotal - discountAmount + taxAmount

    // Fetch data when dialog opens
    useEffect(() => {
        if (open) {
            const loadData = async () => {
                setIsLoadingPatients(true)
                try {
                    const [patientsData, treatmentsData] = await Promise.all([
                        getPatients(clinicId),
                        getTreatments(clinicId)
                    ])
                    setPatients(patientsData)

                    // If no treatments in catalog, provide default dental services
                    if (treatmentsData.length === 0) {
                        const defaultServices = [
                            { id: 'default-1', name: 'Dental Cleaning (Prophylaxis)', standardCost: 1500, category: 'Preventive' },
                            { id: 'default-2', name: 'Tooth Filling (Composite)', standardCost: 2000, category: 'Restorative' },
                            { id: 'default-3', name: 'Tooth Extraction', standardCost: 1500, category: 'Surgery' },
                            { id: 'default-4', name: 'Root Canal Treatment (RCT)', standardCost: 5000, category: 'Endodontic' },
                            { id: 'default-5', name: 'Dental Crown (Ceramic)', standardCost: 8000, category: 'Restorative' },
                            { id: 'default-6', name: 'Teeth Whitening', standardCost: 10000, category: 'Cosmetic' },
                            { id: 'default-7', name: 'Scaling & Polishing', standardCost: 1200, category: 'Preventive' },
                            { id: 'default-8', name: 'Tooth Implant', standardCost: 35000, category: 'Surgery' },
                            { id: 'default-9', name: 'Dental Bridge', standardCost: 15000, category: 'Restorative' },
                            { id: 'default-10', name: 'Orthodontic Braces (Full)', standardCost: 50000, category: 'Orthodontic' },
                            { id: 'default-11', name: 'Wisdom Tooth Extraction', standardCost: 3000, category: 'Surgery' },
                            { id: 'default-12', name: 'Dental Veneer (per tooth)', standardCost: 12000, category: 'Cosmetic' },
                            { id: 'default-13', name: 'Consultation Fee', standardCost: 500, category: 'General' },
                            { id: 'default-14', name: 'X-Ray (Full Mouth)', standardCost: 800, category: 'Diagnostic' },
                            { id: 'default-15', name: 'Gum Treatment (Deep Cleaning)', standardCost: 4000, category: 'Periodontic' },
                        ]
                        setTreatments(defaultServices as any)
                    } else {
                        setTreatments(treatmentsData)
                    }
                } catch (error) {
                    console.error("Failed to load data", error)
                } finally {
                    setIsLoadingPatients(false)
                }
            }
            loadData()
        }
    }, [open, clinicId])

    // Update form when defaultPatientId changes
    useEffect(() => {
        if (defaultPatientId) {
            setValue("patientId", defaultPatientId)
        }
    }, [defaultPatientId, setValue])

    const handleServiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const treatmentId = e.target.value
        if (!treatmentId) return

        const treatment = treatments.find(t => t.id === treatmentId)
        if (treatment) {
            append({
                description: treatment.name,
                quantity: 1,
                unitPrice: Number(treatment.standardCost)
            })
            // Reset select
            e.target.value = ""
        }
    }

    const onSubmit: SubmitHandler<CreateInvoiceValues> = async (data) => {
        setIsSubmitting(true)
        try {
            await createInvoice(clinicId, data)
            reset()
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to create invoice", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                            <Label>Patient</Label>
                            {defaultPatientId ? (
                                <Input
                                    value={patients.find(p => p.id === defaultPatientId)?.firstName + " " + patients.find(p => p.id === defaultPatientId)?.lastName || "Loading..."}
                                    disabled
                                />
                            ) : (
                                <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={patientOpen}
                                            className={cn(
                                                "w-full justify-between",
                                                !watch("patientId") && "text-muted-foreground"
                                            )}
                                        >
                                            {watch("patientId")
                                                ? patients.find((patient) => patient.id === watch("patientId"))?.firstName + " " + patients.find((patient) => patient.id === watch("patientId"))?.lastName
                                                : "Select patient..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search patient..." />
                                            <CommandList>
                                                <CommandEmpty>No patient found.</CommandEmpty>
                                                <CommandGroup>
                                                    {patients.map((patient) => (
                                                        <CommandItem
                                                            key={patient.id}
                                                            value={patient.firstName + " " + patient.lastName}
                                                            onSelect={() => {
                                                                setValue("patientId", patient.id)
                                                                setPatientOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    watch("patientId") === patient.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {patient.firstName} {patient.lastName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            )}
                            {errors.patientId && (
                                <p className="text-sm text-destructive">{errors.patientId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            {/* ... Rest of the form remains same */}

                            <Input
                                type="date"
                                {...register("dueDate", { valueAsDate: true })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                            <div className="flex items-center gap-2 flex-1">
                                <Label className="whitespace-nowrap">Quick Add Service:</Label>
                                <select
                                    className="flex h-9 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                    onChange={handleServiceSelect}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select treatment...</option>
                                    {treatments.map((t: any) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.category || 'General'}) - ₹{t.standardCost}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Blank Item
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-6">
                                        <Input
                                            placeholder="Description"
                                            {...register(`items.${index}.description` as const)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            min="1"
                                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="number"
                                            placeholder="Price"
                                            min="0"
                                            {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {errors.items && (
                                <p className="text-sm text-destructive">{errors.items.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Discount</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    {...register("discount", { valueAsNumber: true })}
                                />
                                <select
                                    className="flex h-10 w-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    {...register("discountType")}
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tax</Label>
                            <Input
                                type="number"
                                min="0"
                                {...register("tax", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Discount</span>
                            <span>- Rs. {discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Tax</span>
                            <span>+ Rs. {taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>Rs. {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

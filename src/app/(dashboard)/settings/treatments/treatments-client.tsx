"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { TREATMENT_CATEGORIES } from "@/lib/validations/treatment"
import { createTreatment, updateTreatment, deleteTreatment } from "@/lib/actions/treatments"
import { useRouter } from "next/navigation"

interface Treatment {
    id: string
    code?: string | null
    name: string
    description?: string | null
    standardCost: number
    category: string
    duration?: number | null
    isActive: boolean
}

interface TreatmentsClientProps {
    initialTreatments: Treatment[]
    clinicId: string
}

export function TreatmentsClient({ initialTreatments, clinicId }: TreatmentsClientProps) {
    const [treatments, setTreatments] = useState(initialTreatments)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        standardCost: "",
        category: "",
        duration: "",
    })

    const groupedTreatments = treatments.reduce((acc, treatment) => {
        if (!acc[treatment.category]) {
            acc[treatment.category] = []
        }
        acc[treatment.category].push(treatment)
        return acc
    }, {} as Record<string, Treatment[]>)

    const handleOpenDialog = (treatment?: Treatment) => {
        if (treatment) {
            setEditingTreatment(treatment)
            setFormData({
                code: treatment.code || "",
                name: treatment.name,
                description: treatment.description || "",
                standardCost: String(treatment.standardCost),
                category: treatment.category,
                duration: treatment.duration ? String(treatment.duration) : "",
            })
        } else {
            setEditingTreatment(null)
            setFormData({
                code: "",
                name: "",
                description: "",
                standardCost: "",
                category: "",
                duration: "",
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const data: any = {
                code: formData.code || undefined,
                name: formData.name,
                description: formData.description || undefined,
                standardCost: parseFloat(formData.standardCost),
                category: formData.category,
                duration: formData.duration ? parseInt(formData.duration) : undefined,
            }

            if (editingTreatment) {
                const updated = await updateTreatment(editingTreatment.id, data)
                setTreatments(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
            } else {
                const created = await createTreatment(clinicId, data)
                setTreatments(prev => [...prev, created as Treatment])
            }
            setIsDialogOpen(false)
            router.refresh()
        } catch (error) {
            console.error("Failed to save treatment", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this treatment?")) return

        try {
            await deleteTreatment(id)
            setTreatments(prev => prev.filter(t => t.id !== id))
            router.refresh()
        } catch (error) {
            console.error("Failed to delete treatment", error)
        }
    }

    return (
        <div className="flex flex-col">
            <Header
                title="Treatment Catalog"
                description="Manage your clinic's services and pricing"
                action={{
                    label: "Add Treatment",
                    onClick: () => handleOpenDialog(),
                }}
            />

            <div className="flex-1 p-6 space-y-6">
                {treatments.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No treatments found. Click 'Add Treatment' to get started.
                    </div>
                )}
                {Object.entries(groupedTreatments).map(([category, categoryTreatments]) => (
                    <Card key={category}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{category}</CardTitle>
                                <Badge variant="secondary">{categoryTreatments.length} services</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {categoryTreatments.map((treatment) => (
                                    <div
                                        key={treatment.id}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {treatment.code && (
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {treatment.code}
                                                    </span>
                                                )}
                                                <span className="font-medium">{treatment.name}</span>
                                            </div>
                                            {treatment.description && (
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    {treatment.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {treatment.duration && (
                                                <span className="text-sm text-muted-foreground">
                                                    {treatment.duration} min
                                                </span>
                                            )}
                                            <span className="font-semibold text-primary">
                                                {formatCurrency(treatment.standardCost)}
                                            </span>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleOpenDialog(treatment)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(treatment.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingTreatment ? "Edit Treatment" : "Add New Treatment"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTreatment
                                ? "Update the treatment details below."
                                : "Add a new service to your treatment catalog."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Service Code</Label>
                                <Input
                                    id="code"
                                    placeholder="D0120"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, code: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <select
                                    id="category"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                    required
                                >
                                    <option value="">Select category</option>
                                    {TREATMENT_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Treatment Name *</Label>
                            <Input
                                id="name"
                                placeholder="Root Canal - Molar"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="Brief description of the treatment"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="standardCost">Standard Cost (₹) *</Label>
                                <Input
                                    id="standardCost"
                                    type="number"
                                    placeholder="5000"
                                    value={formData.standardCost}
                                    onChange={(e) =>
                                        setFormData({ ...formData, standardCost: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    placeholder="30"
                                    value={formData.duration}
                                    onChange={(e) =>
                                        setFormData({ ...formData, duration: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingTreatment ? "Save Changes" : "Add Treatment"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Loader2 } from "lucide-react"
import { exportPatients } from "@/lib/actions/patients"
import { format } from "date-fns"

interface ExportPatientsDialogProps {
    clinicId: string
}

export function ExportPatientsDialog({ clinicId }: ExportPatientsDialogProps) {
    const [open, setOpen] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const start = startDate ? new Date(startDate) : undefined
            const end = endDate ? new Date(endDate) : undefined

            const data = await exportPatients(clinicId, start, end)

            if (!data || data.length === 0) {
                alert("No patients found for the selected range.")
                setIsExporting(false)
                return
            }

            // Convert to CSV
            const csvContent = "data:text/csv;charset=utf-8," +
                "ID,First Name,Last Name,Phone,Email,DoB,Gender,Last Visit,Created At\n" +
                data.map((p: any) => {
                    const dob = p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : ""
                    const lastVisit = p.lastVisitDate ? new Date(p.lastVisitDate).toISOString().split('T')[0] : ""
                    const created = new Date(p.createdAt).toISOString().split('T')[0]
                    return `${p.id},${p.firstName},${p.lastName},${p.phone},${p.email || ""},${dob},${p.gender || ""},${lastVisit},${created}`
                }).join("\n")

            const encodedUri = encodeURI(csvContent)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", `patients_export_${format(new Date(), 'yyyy-MM-dd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setOpen(false)
        } catch (error) {
            console.error("Export failed", error)
            alert("Export failed.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Patients</DialogTitle>
                    <DialogDescription>
                        Select a date range to filter patients by registration date. Leave empty to export all.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="from">From Date</Label>
                            <Input
                                id="from"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to">To Date</Label>
                            <Input
                                id="to"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

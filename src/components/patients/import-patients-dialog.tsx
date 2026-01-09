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
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { importPatients } from "@/lib/actions/patients"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ImportPatientsDialogProps {
    clinicId: string
    onSuccess?: () => void
}

export function ImportPatientsDialog({ clinicId, onSuccess }: ImportPatientsDialogProps) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<any[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            parseCSV(selectedFile)
        }
    }

    const parseCSV = async (file: File) => {
        setIsParsing(true)
        setParsedData([])

        try {
            const text = await file.text()
            const lines = text.split('\n')
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

            // Expected headers: firstName, lastName, phone, dateOfBirth...
            // We map strict index or match names

            const data = []

            // Start from 1 to skip header
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue

                // Simple split by comma (doesn't handle commas in quotes perfectly but robust enough for simple CSVs)
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))

                if (values.length < 3) continue // Skip incomplete

                const record: any = {}
                headers.forEach((header, index) => {
                    const key = header.toLowerCase()
                    if (key.includes('first')) record.firstName = values[index]
                    else if (key.includes('last')) record.lastName = values[index]
                    else if (key.includes('phone') || key.includes('mobile')) record.phone = values[index]
                    else if (key.includes('email')) record.email = values[index]
                    else if (key.includes('birth') || key.includes('dob')) record.dateOfBirth = values[index]
                    else if (key.includes('gender') || key.includes('sex')) record.gender = values[index]
                    else if (key.includes('address')) record.address = values[index]
                })

                if (record.firstName && record.lastName) {
                    data.push(record)
                }
            }

            setParsedData(data)
        } catch (error) {
            console.error(error)
            toast({
                title: "Error parsing CSV",
                description: "Please ensure the file format is correct.",
                variant: "destructive"
            })
        } finally {
            setIsParsing(false)
        }
    }

    const handleImport = async () => {
        if (parsedData.length === 0) return

        setIsImporting(true)
        try {
            const result = await importPatients(clinicId, parsedData)

            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${result.count} patients.`,
                })
                setOpen(false)
                setFile(null)
                setParsedData([])
                router.refresh()
                if (onSuccess) onSuccess()
            } else {
                toast({
                    title: "Import Warning",
                    description: result.error || "Some records failed to import.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Import Failed",
                description: "An unexpected error occurred.",
                variant: "destructive"
            })
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Patients</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: firstName, lastName, phone, dateOfBirth, email
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csvFile">CSV File</Label>
                        <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>

                    {isParsing && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            Parsing file...
                        </div>
                    )}

                    {!isParsing && parsedData.length > 0 && (
                        <div className="rounded-md bg-muted p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-sm">Ready to import</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                found <strong>{parsedData.length}</strong> valid patient records.
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground max-h-[100px] overflow-y-auto border-t pt-2">
                                {parsedData.slice(0, 5).map((p, i) => (
                                    <div key={i} className="truncate">
                                        {i + 1}. {p.firstName} {p.lastName} - {p.phone}
                                    </div>
                                ))}
                                {parsedData.length > 5 && <div>...and {parsedData.length - 5} more</div>}
                            </div>
                        </div>
                    )}

                    {!isParsing && file && parsedData.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                            <AlertCircle className="h-4 w-4" />
                            <span>No valid records found in file. Check format.</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={parsedData.length === 0 || isImporting}>
                        {isImporting ? "Importing..." : "Import Patients"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

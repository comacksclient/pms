"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    DollarSign,
    Receipt,
    TrendingUp,
    Clock,
    Download,
    Eye,
    CreditCard,
    Loader2,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/validations/invoice"
import { PDFDownloadLink } from "@react-pdf/renderer"

import { recordPayment } from "@/lib/actions/invoices"
import { CreateInvoiceDialog } from "@/components/billing/create-invoice-dialog"
import { useSearchParams, useRouter } from "next/navigation"
import { InvoicePDF } from "@/components/billing/invoice-pdf"

interface BillingClientProps {
    initialInvoices: any[]
    clinicId: string
}

export function BillingClient({ initialInvoices, clinicId }: BillingClientProps) {
    const [invoices, setInvoices] = useState(initialInvoices)
    const [filter, setFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("CASH")
    const [isLoading, setIsLoading] = useState(false)
    const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const patientIdParam = searchParams.get("patientId")
    const highlightId = searchParams.get("highlight")

    // Sync local state with server data when props change
    useEffect(() => {
        setInvoices(initialInvoices)
    }, [initialInvoices])

    // Open create dialog if patientId is present
    useEffect(() => {
        if (patientIdParam) {
            setFilter("all")
            setSearchQuery("")
            setIsCreateInvoiceOpen(true)
        }
    }, [patientIdParam])

    // Refresh data handler
    const handleInvoiceCreated = () => {
        // In a real app with server actions, revalidatePath handles data refresh.
        // But we might need to reset filtered view or show success.
        setIsCreateInvoiceOpen(false)
        router.refresh()
        // Optionally remove query param
        if (patientIdParam) {
            router.replace("/billing")
        }
    }

    // Calculate stats based on real data
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0)
    const outstanding = invoices.filter(inv => inv.status !== "PAID").reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0)
    const collectedToday = 0 // Needs payment date logic or separate fetch, keeping 0 or removing stat for now
    const invoicesCount = invoices.length

    const stats = [
        {
            title: "Total Revenue",
            value: formatCurrency(totalRevenue),
            change: "Total",
            icon: DollarSign,
            description: "All time",
        },
        {
            title: "Outstanding",
            value: formatCurrency(outstanding),
            change: "Unpaid",
            icon: Clock,
            description: "Pending payment",
        },
        {
            title: "Invoices Created",
            value: invoicesCount.toString(),
            change: "Total",
            icon: Receipt,
            description: "All time",
        },
    ]

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesFilter = filter === "all" || invoice.status === filter.toUpperCase()
        const matchesSearch =
            (invoice.patient?.firstName + " " + invoice.patient?.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const handleRecordPayment = (invoice: any) => {
        setSelectedInvoice(invoice)
        setPaymentAmount(String(invoice.total - invoice.amountPaid))
        setIsPaymentDialogOpen(true)
    }

    const handleSubmitPayment = async () => {
        if (!selectedInvoice) return
        setIsLoading(true)

        try {
            const paymentResult = await recordPayment({
                invoiceId: selectedInvoice.id,
                amount: parseFloat(paymentAmount),
                method: paymentMethod as any,
                notes: "Recorded via Dashboard",
                reference: ""
            })

            // Update local state
            const newPaidAmount = selectedInvoice.amountPaid + parseFloat(paymentAmount)
            const newStatus = newPaidAmount >= selectedInvoice.total ? "PAID" : "PARTIAL"

            setInvoices(invoices.map(inv =>
                inv.id === selectedInvoice.id
                    ? { ...inv, amountPaid: newPaidAmount, status: newStatus }
                    : inv
            ))

            setIsPaymentDialogOpen(false)
            setSelectedInvoice(null)
        } catch (error) {
            console.error("Payment failed", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Billing"
                description="Manage invoices and payments"
                action={{
                    label: "New Invoice",
                    onClick: () => setIsCreateInvoiceOpen(true),
                }}
            />

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.change} · {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Invoices Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle>Recent Invoices</CardTitle>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search invoices..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-64"
                                />
                                <div className="flex gap-1 rounded-lg border p-1">
                                    {["all", "pending", "partial", "paid"].map((status) => (
                                        <Button
                                            key={status}
                                            variant={filter === status ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setFilter(status)}
                                            className="capitalize"
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Invoice</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Patient</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Paid</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Balance</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-b hover:bg-muted/50">
                                            <td className="px-4 py-3 font-mono text-sm">{invoice.invoiceNumber || invoice.number}</td>
                                            <td className="px-4 py-3 font-medium">{invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : invoice.patientName}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {invoice.createdAt ? format(new Date(invoice.createdAt), "dd MMM yyyy") : format(invoice.date, "dd MMM yyyy")}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(invoice.total)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-success">
                                                {formatCurrency(invoice.amountPaid)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {invoice.total - invoice.amountPaid > 0 ? (
                                                    <span className="text-warning font-medium">
                                                        {formatCurrency(invoice.total - invoice.amountPaid)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={invoice.status.toLowerCase() as any}>{invoice.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/billing/${invoice.id}`)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <PDFDownloadLink
                                                        document={
                                                            <InvoicePDF
                                                                invoice={{
                                                                    ...invoice,
                                                                    // Map prisma model to invoice type expected by PDF
                                                                    number: invoice.invoiceNumber,
                                                                    date: invoice.createdAt || invoice.date,
                                                                    dueDate: invoice.dueDate,
                                                                    patientName: invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : invoice.patientName,
                                                                    items: invoice.items?.map((i: any) => ({
                                                                        description: i.description,
                                                                        quantity: i.quantity,
                                                                        unitPrice: i.unitPrice,
                                                                        total: i.total
                                                                    })) || [],
                                                                    patient: invoice.patient ? {
                                                                        firstName: invoice.patient.firstName,
                                                                        lastName: invoice.patient.lastName,
                                                                        email: invoice.patient.email || "",
                                                                        phone: invoice.patient.phone
                                                                    } : { firstName: "", lastName: "", email: "", phone: "" }
                                                                }}
                                                                clinicName={invoice.clinic?.name}
                                                                clinicAddress={invoice.clinic?.address}
                                                                clinicPhone={invoice.clinic?.phone}
                                                                clinicEmail={invoice.clinic?.email}
                                                            />
                                                        }
                                                        fileName={`${invoice.invoiceNumber || invoice.id}.pdf`}
                                                    >
                                                        {/* @ts-ignore - render prop type mismatch */}
                                                        {({ loading }) => (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
                                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                            </Button>
                                                        )}
                                                    </PDFDownloadLink>
                                                    {invoice.status !== "PAID" && invoice.status !== "paid" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-primary"
                                                            onClick={() => handleRecordPayment(invoice)}
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment for invoice {selectedInvoice?.invoiceNumber || selectedInvoice?.number}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted p-4">
                                <div className="flex justify-between text-sm">
                                    <span>Invoice Total</span>
                                    <span className="font-medium">{formatCurrency(selectedInvoice.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span>Already Paid</span>
                                    <span className="text-success">{formatCurrency(selectedInvoice.amountPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1 font-medium">
                                    <span>Balance Due</span>
                                    <span className="text-warning">
                                        {formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Payment Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="method">Payment Method</Label>
                                <select
                                    id="method"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    {PAYMENT_METHODS.map((method) => (
                                        <option key={method.value} value={method.value}>
                                            {method.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmitPayment} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Record Payment
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <CreateInvoiceDialog
                open={isCreateInvoiceOpen}
                onOpenChange={setIsCreateInvoiceOpen}
                clinicId={clinicId}
                defaultPatientId={patientIdParam}
                onSuccess={handleInvoiceCreated}
            />
        </div >
    )
}

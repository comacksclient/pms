"use client"

import { useState } from "react"
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

interface Invoice {
    id: string
    number: string
    patientName: string
    date: Date
    dueDate: Date | null
    subtotal: number
    discount: number
    tax: number
    total: number
    amountPaid: number
    status: "draft" | "pending" | "partial" | "paid" | "cancelled"
}

const mockInvoices: Invoice[] = [
    {
        id: "1",
        number: "INV-2601-A1B2",
        patientName: "Rahul Sharma",
        date: new Date("2026-01-07"),
        dueDate: new Date("2026-01-21"),
        subtotal: 12000,
        discount: 0,
        tax: 0,
        total: 12000,
        amountPaid: 12000,
        status: "paid",
    },
    {
        id: "2",
        number: "INV-2601-C3D4",
        patientName: "Priya Patel",
        date: new Date("2026-01-06"),
        dueDate: new Date("2026-01-20"),
        subtotal: 5500,
        discount: 500,
        tax: 0,
        total: 5000,
        amountPaid: 3000,
        status: "partial",
    },
    {
        id: "3",
        number: "INV-2601-E5F6",
        patientName: "Amit Kumar",
        date: new Date("2026-01-05"),
        dueDate: new Date("2026-01-19"),
        subtotal: 8000,
        discount: 0,
        tax: 0,
        total: 8000,
        amountPaid: 0,
        status: "pending",
    },
    {
        id: "4",
        number: "INV-2601-G7H8",
        patientName: "Sneha Gupta",
        date: new Date("2026-01-04"),
        dueDate: null,
        subtotal: 1500,
        discount: 0,
        tax: 0,
        total: 1500,
        amountPaid: 1500,
        status: "paid",
    },
    {
        id: "5",
        number: "INV-2512-I9J0",
        patientName: "Vikram Singh",
        date: new Date("2025-12-28"),
        dueDate: new Date("2026-01-11"),
        subtotal: 3500,
        discount: 0,
        tax: 0,
        total: 3500,
        amountPaid: 3500,
        status: "paid",
    },
]

const stats = [
    {
        title: "Total Revenue",
        value: formatCurrency(452300),
        change: "+23%",
        icon: DollarSign,
        description: "This month",
    },
    {
        title: "Outstanding",
        value: formatCurrency(42000),
        change: "12 invoices",
        icon: Clock,
        description: "Pending payment",
    },
    {
        title: "Collected Today",
        value: formatCurrency(15500),
        change: "+8%",
        icon: TrendingUp,
        description: "vs yesterday",
    },
    {
        title: "Invoices Created",
        value: "156",
        change: "This month",
        icon: Receipt,
        description: "32 pending",
    },
]

export default function BillingPage() {
    const [invoices, setInvoices] = useState(mockInvoices)
    const [filter, setFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("CASH")
    const [isLoading, setIsLoading] = useState(false)

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesFilter = filter === "all" || invoice.status === filter
        const matchesSearch =
            invoice.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.number.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const handleRecordPayment = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setPaymentAmount(String(invoice.total - invoice.amountPaid))
        setIsPaymentDialogOpen(true)
    }

    const handleSubmitPayment = async () => {
        if (!selectedInvoice) return
        setIsLoading(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const amount = parseFloat(paymentAmount)
        const newPaidAmount = selectedInvoice.amountPaid + amount
        const newStatus: Invoice["status"] =
            newPaidAmount >= selectedInvoice.total ? "paid" : "partial"

        setInvoices(
            invoices.map((inv) =>
                inv.id === selectedInvoice.id
                    ? { ...inv, amountPaid: newPaidAmount, status: newStatus }
                    : inv
            )
        )

        setIsLoading(false)
        setIsPaymentDialogOpen(false)
        setSelectedInvoice(null)
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Billing"
                description="Manage invoices and payments"
                action={{
                    label: "New Invoice",
                    onClick: () => console.log("New invoice"),
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
                                            <td className="px-4 py-3 font-mono text-sm">{invoice.number}</td>
                                            <td className="px-4 py-3 font-medium">{invoice.patientName}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {format(invoice.date, "dd MMM yyyy")}
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
                                                <Badge variant={invoice.status}>{invoice.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {invoice.status !== "paid" && (
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
                            Record a payment for invoice {selectedInvoice?.number}
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
        </div>
    )
}

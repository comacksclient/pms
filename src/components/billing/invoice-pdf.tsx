"use client"

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
} from "@react-pdf/renderer"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

// Register fonts
Font.register({
    family: "Open Sans",
    fonts: [
        { src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf" },
        { src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf", fontWeight: 600 },
    ],
})

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Open Sans",
        fontSize: 10,
        color: "#333",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    logo: {
        fontSize: 20,
        fontWeight: 600,
        color: "#0284c7", // Clinical Blue
        marginBottom: 4,
    },
    clinicInfo: {
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 600,
        color: "#111",
        marginBottom: 10,
    },
    label: {
        color: "#666",
        fontSize: 8,
        marginBottom: 2,
        marginTop: 8,
    },
    value: {
        fontSize: 10,
        fontWeight: 600,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    col: {
        flex: 1,
    },
    table: {
        marginTop: 30,
        width: "100%",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    tableRow: {
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    descriptionFn: {
        flex: 2,
    },
    qty: {
        flex: 0.5,
        textAlign: "center",
    },
    price: {
        flex: 1,
        textAlign: "right",
    },
    total: {
        flex: 1,
        textAlign: "right",
        fontWeight: 600,
    },
    footer: {
        marginTop: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    summary: {
        marginTop: 20,
        alignSelf: "flex-end",
        width: 200,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 600,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 600,
        color: "#0284c7",
    },
    status: {
        padding: 4,
        backgroundColor: "#e0f2fe",
        color: "#0284c7",
        borderRadius: 4,
        fontSize: 8,
        alignSelf: "flex-start",
        marginTop: 4,
    },
})

interface InvoicePDFProps {
    invoice: any // Typed as any to avoid conflicts for now, will refine
    clinicName?: string
    clinicAddress?: string
}

// Helper for PDF currency to avoid font issues with ₹ symbol
const formatCurrencyPDF = (amount: any) => {
    const val = Number(amount) || 0
    return `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function InvoicePDF({ invoice, clinicName = "Smile Dental Clinic", clinicAddress = "123 Medical Drive, New Delhi, India" }: InvoicePDFProps) {
    // Ensure numbers for math
    const totalAmount = Number(invoice.total) || 0
    const paidAmount = Number(invoice.amountPaid) || 0
    const balanceDue = totalAmount - paidAmount

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.logo}>{clinicName}</Text>
                        <Text style={styles.value}>{clinicAddress}</Text>
                        <Text>Phone: +91 98765 43210</Text>
                        <Text>Email: contact@smiledental.com</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.title}>INVOICE</Text>
                        <Text style={styles.value}>#{invoice.invoiceNumber || invoice.id.slice(0, 8)}</Text>
                        <View style={styles.status}>
                            <Text>{(invoice.status || 'DRAFT').toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>BILL TO</Text>
                        <Text style={styles.value}>{invoice.patient.firstName} {invoice.patient.lastName}</Text>
                        <Text>{invoice.patient.address || ""}</Text>
                        <Text>{invoice.patient.email}</Text>
                        <Text>{invoice.patient.phone}</Text>
                    </View>
                    <View style={[styles.col, { alignItems: "flex-end" }]}>
                        <Text style={styles.label}>DATE</Text>
                        <Text style={styles.value}>{format(new Date(invoice.createdAt), "MMMM d, yyyy")}</Text>
                        <Text style={styles.label}>DUE DATE</Text>
                        <Text style={styles.value}>{format(new Date(invoice.dueDate || invoice.createdAt), "MMMM d, yyyy")}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.value, styles.descriptionFn]}>Description</Text>
                        <Text style={[styles.value, styles.qty]}>Qty</Text>
                        <Text style={[styles.value, styles.price]}>Unit Price</Text>
                        <Text style={[styles.value, styles.total]}>Total</Text>
                    </View>
                    {invoice.items.map((item: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.descriptionFn}>{item.description}</Text>
                            <Text style={styles.qty}>{item.quantity}</Text>
                            <Text style={styles.price}>{formatCurrencyPDF(item.unitPrice)}</Text>
                            <Text style={styles.total}>{formatCurrencyPDF(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <Text>Subtotal</Text>
                        <Text style={styles.value}>{formatCurrencyPDF(totalAmount)}</Text>
                    </View>
                    {/* Discount could go here */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>{formatCurrencyPDF(totalAmount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text>Amount Paid</Text>
                        <Text style={styles.value}>{formatCurrencyPDF(paidAmount)}</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 5 }]}>
                        <Text style={{ color: balanceDue > 0 ? '#ef4444' : '#22c55e' }}>Balance Due</Text>
                        <Text style={[styles.value, { color: balanceDue > 0 ? '#ef4444' : '#22c55e' }]}>
                            {formatCurrencyPDF(balanceDue)}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={{ textAlign: "center", color: "#999" }}>
                        Thank you for your business. Please contact us for any payment queries.
                    </Text>
                </View>
            </Page>
        </Document>
    )
}

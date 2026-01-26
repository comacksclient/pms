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

// ... imports remain the same

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        lineHeight: 1.5,
        color: "#1e293b",
    },
    // Header Section (Split Layout)
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        paddingBottom: 20,
    },
    brandColumn: {
        flexDirection: "column",
        maxWidth: '60%',
    },
    clinicName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 8, // Increased from 4
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    clinicDetail: {
        fontSize: 10,
        color: "#64748b",
        marginBottom: 4, // Increased from 2
    },
    invoiceMetaColumn: {
        flexDirection: "column",
        alignItems: "flex-end",
    },
    invoiceTitle: {
        fontSize: 18,
        fontWeight: "bold", // Helvetica bold
        color: "#cbd5e1", // Light gray for "INVOICE"
        marginBottom: 8,
        letterSpacing: 2,
    },
    metaLabel: {
        fontSize: 9,
        color: "#94a3b8",
        marginBottom: 1,
    },
    metaValue: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 4,
        textAlign: "right",
    },

    // Patient Info Section (Grid)
    clientSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        padding: 15,
        backgroundColor: "#f8fafc", // Light gray box for client info
        borderRadius: 4,
    },
    clientCol: {
        flexDirection: "column",
    },
    label: {
        fontSize: 8,
        color: "#94a3b8",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: "bold",
    },
    value: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 2,
    },
    subValue: {
        fontSize: 10,
        color: "#64748b",
    },

    // Table Content
    tableContainer: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 2,
        borderBottomColor: "#0f172a", // Dark border for header
        paddingBottom: 8,
        marginBottom: 10,
    },
    tableHeaderLabel: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#0f172a",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    colDesc: { flex: 4, textAlign: "left" },
    colQty: { flex: 1, textAlign: "center" },
    colPrice: { flex: 2, textAlign: "right" },
    colTotal: { flex: 2, textAlign: "right" },

    itemName: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0f172a",
    },

    // Totals Section
    footerContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
    },
    totalsBox: {
        width: "45%",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9", // Subtle separator
    },
    lastTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: "#0f172a",
    },
    totalLabel: {
        fontSize: 10,
        color: "#64748b",
        fontWeight: "bold",
    },
    totalValue: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#0f172a",
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#0f172a",
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0f172a",
    },

    // Footer Note
    footerMessage: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 9,
        color: "#94a3b8",
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 10,
    }
})

interface InvoicePDFProps {
    invoice: any
    clinicName?: string
    clinicAddress?: string
    clinicPhone?: string
    clinicEmail?: string
}

const formatCurrencyPDF = (amount: any) => {
    const val = Number(amount) || 0
    return `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function InvoicePDF({
    invoice,
    clinicName = "Smile Science",
    clinicAddress = "west vinod nagar",
    clinicPhone = "+91 98765 43210",
    clinicEmail = "comacksclient"
}: InvoicePDFProps) {
    // Handle potential nulls
    const safeClinicName = clinicName || "Smile Science"
    const safeClinicAddress = clinicAddress || "west vinod nagar"
    const safeClinicPhone = clinicPhone || "+91 98765 43210"
    const safeClinicEmail = clinicEmail || "comacksclient"

    const subtotal = Number(invoice.subtotal) || 0
    const discount = Number(invoice.discount) || 0
    const tax = Number(invoice.tax) || 0
    const totalAmount = Number(invoice.total) || 0

    const formatDate = (date: any) => {
        try {
            return date ? format(new Date(date), "dd MMM yyyy") : "-"
        } catch (e) { return "-" }
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* 1. Header: Brand (Left) & Meta (Right) */}
                <View style={styles.header}>
                    <View style={styles.brandColumn}>
                        <Text style={styles.clinicName}>{safeClinicName}</Text>
                        <Text style={styles.clinicDetail}>{safeClinicAddress}</Text>
                        <Text style={styles.clinicDetail}>{safeClinicPhone} • {safeClinicEmail}</Text>
                    </View>
                    <View style={styles.invoiceMetaColumn}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.metaLabel}>Invoice #</Text>
                        <Text style={styles.metaValue}>{invoice.invoiceNumber || invoice.id.slice(0, 8)}</Text>
                        <Text style={styles.metaLabel}>Date Issued</Text>
                        <Text style={styles.metaValue}>{formatDate(invoice.createdAt)}</Text>
                    </View>
                </View>

                {/* 2. Client Info Section (Boxed) */}
                <View style={styles.clientSection}>
                    <View style={styles.clientCol}>
                        <Text style={styles.label}>Billed To</Text>
                        <Text style={styles.value}>{invoice.patient.firstName} {invoice.patient.lastName}</Text>
                        <Text style={styles.subValue}>{invoice.patient.email}</Text>
                        {invoice.patient.phone && <Text style={styles.subValue}>{invoice.patient.phone}</Text>}
                    </View>
                    <View style={styles.clientCol}>
                        <Text style={styles.label}>Due Date</Text>
                        <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
                    </View>
                    <View style={styles.clientCol}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={[styles.value, { color: invoice.status === 'PAID' ? '#16a34a' : '#0f172a' }]}>
                            {invoice.status || 'DRAFT'}
                        </Text>
                    </View>
                </View>

                {/* 3. Items Table */}
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderLabel, styles.colDesc]}>Description</Text>
                        <Text style={[styles.tableHeaderLabel, styles.colQty]}>Qty</Text>
                        <Text style={[styles.tableHeaderLabel, styles.colPrice]}>Rate</Text>
                        <Text style={[styles.tableHeaderLabel, styles.colTotal]}>Amount</Text>
                    </View>

                    {invoice.items.map((item: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.colDesc, styles.itemName]}>{item.description}</Text>
                            <Text style={[styles.colQty, { fontSize: 10 }]}>{item.quantity}</Text>
                            <Text style={[styles.colPrice, { fontSize: 10 }]}>{formatCurrencyPDF(item.unitPrice)}</Text>
                            <Text style={[styles.colTotal, { fontWeight: 'bold', fontSize: 10 }]}>{formatCurrencyPDF(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {/* 4. Totals */}
                <View style={styles.footerContainer}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>{formatCurrencyPDF(subtotal)}</Text>
                        </View>

                        {discount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Discount</Text>
                                <Text style={styles.totalValue}>-{formatCurrencyPDF(discount)}</Text>
                            </View>
                        )}

                        {tax > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Tax</Text>
                                <Text style={styles.totalValue}>+{formatCurrencyPDF(tax)}</Text>
                            </View>
                        )}

                        <View style={styles.lastTotalRow}>
                            <Text style={styles.grandTotalLabel}>Total</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrencyPDF(totalAmount)}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={[styles.totalLabel, { fontSize: 9 }]}>Amount Paid</Text>
                            <Text style={[styles.totalValue, { fontSize: 9, color: '#64748b' }]}>{formatCurrencyPDF(invoice.amountPaid)}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={[styles.totalLabel, { color: invoice.total - invoice.amountPaid > 0 ? '#ef4444' : '#22c55e' }]}>Balance Due</Text>
                            <Text style={[styles.totalValue, { color: invoice.total - invoice.amountPaid > 0 ? '#ef4444' : '#22c55e' }]}>
                                {formatCurrencyPDF(totalAmount - Number(invoice.amountPaid))}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 5. Footer Message */}
                <Text style={styles.footerMessage}>
                    Thank you for choosing {safeClinicName}.
                </Text>

            </Page>
        </Document>
    )
}
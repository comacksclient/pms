
import prisma from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear, subYears } from "date-fns"

export async function getDashboardStats(clinicId: string) {
    const startOfCurrentMonth = startOfMonth(new Date())
    const endOfCurrentMonth = endOfMonth(new Date())
    const startOfLastMonth = startOfMonth(subMonths(new Date(), 1))
    const endOfLastMonth = endOfMonth(subMonths(new Date(), 1))

    // Run independent queries in parallel
    const [
        totalPatients,
        appointmentsToday,
        appointmentsCompletedToday,
        totalRevenueResult,
        currentMonthRevenueResult,
        lastMonthRevenueResult,
        pendingInvoices
    ] = await Promise.all([
        // 1. Total Patients
        prisma.patient.count({ where: { clinicId } }),

        // 2. Today's Appointments (Total)
        prisma.appointment.count({
            where: {
                clinicId,
                scheduledAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(24, 0, 0, 0)),
                },
            },
        }),

        // 3. Today's Appointments (Completed)
        prisma.appointment.count({
            where: {
                clinicId,
                status: "COMPLETED",
                scheduledAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(24, 0, 0, 0)),
                },
            },
        }),

        // 4. Total Revenue (All Time)
        prisma.payment.aggregate({
            where: { invoice: { clinicId } },
            _sum: { amount: true },
        }),

        // 5. Current Month Revenue
        prisma.payment.aggregate({
            where: {
                invoice: { clinicId },
                paidAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
            },
            _sum: { amount: true },
        }),

        // 6. Last Month Revenue
        prisma.payment.aggregate({
            where: {
                invoice: { clinicId },
                paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
            },
            _sum: { amount: true },
        }),

        // 7. Pending Invoices
        prisma.invoice.count({
            where: {
                clinicId,
                status: { in: ["PENDING", "PARTIAL"] }
            }
        })
    ])

    // Process results
    const totalRevenueValue = totalRevenueResult._sum.amount ? Number(totalRevenueResult._sum.amount) : 0
    const revenueValue = currentMonthRevenueResult._sum.amount ? Number(currentMonthRevenueResult._sum.amount) : 0
    const lastRevenueValue = lastMonthRevenueResult._sum.amount ? Number(lastMonthRevenueResult._sum.amount) : 0
    const revenueChange = lastRevenueValue === 0 ? 100 : ((revenueValue - lastRevenueValue) / lastRevenueValue) * 100

    return [
        {
            title: "Total Patients",
            value: totalPatients.toString(),
            change: "Total registered",
            trend: "neutral",
            description: "Active patients",
        },
        {
            title: "Today's Appointments",
            value: appointmentsToday.toString(),
            change: `${appointmentsCompletedToday} completed`,
            trend: appointmentsCompletedToday > 0 ? "up" : "neutral",
            description: "Scheduled today",
        },
        {
            title: "Total Revenue",
            value: totalRevenueValue,
            isCurrency: true,
            change: `${revenueChange > 0 ? "+" : ""}${Math.round(revenueChange)}%`,
            trend: revenueChange > 0 ? "up" : revenueChange < 0 ? "down" : "neutral",
            description: "vs last month",
        },
        {
            title: "Pending Invoices",
            value: pendingInvoices.toString(),
            change: "Awaiting payment",
            trend: "neutral",
            description: "Outstanding",
        },
    ]
}

export async function getUpcomingAppointments(clinicId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const appointments = await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: { gte: today },
            status: { in: ["SCHEDULED", "CONFIRMED", "SEATED"] }
        },
        include: {
            patient: { select: { firstName: true, lastName: true } },
            doctor: { select: { firstName: true, lastName: true } }
        },
        orderBy: { scheduledAt: "asc" },
        take: 5
    })

    return appointments
}

export async function getRecentActivity(clinicId: string) {
    const recentAppointments = await prisma.appointment.findMany({
        where: { clinicId }, // Removed status: "COMPLETED" to show all activity
        include: {
            patient: { select: { firstName: true, lastName: true } }
        },
        orderBy: { updatedAt: "desc" },
        take: 5
    })

    return recentAppointments.map(apt => ({
        id: apt.id,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
        treatment: apt.type,
        action: apt.status.toLowerCase(), // Use actual status
        time: apt.updatedAt.toISOString()
    }))
}

export async function getRevenueChartData(clinicId: string) {
    const today = new Date()
    const months = []

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        months.push({
            label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
            start: startOfMonth(d),
            end: endOfMonth(d)
        })
    }

    // Optimization: Single Query
    const startDate = months[0].start
    const endDate = months[months.length - 1].end

    const payments = await prisma.payment.findMany({
        where: {
            invoice: { clinicId },
            paidAt: { gte: startDate, lte: endDate }
        },
        select: { amount: true, paidAt: true }
    })

    const data = months.map(m => {
        const total = payments
            .filter(p => {
                if (!p.paidAt) return false
                const d = new Date(p.paidAt)
                return d >= m.start && d <= m.end
            })
            .reduce((sum, p) => sum + Number(p.amount), 0)

        return { name: m.label, value: total }
    })

    return data
}

export async function getRevenueChartDataWeekly(clinicId: string) {
    const today = new Date()
    const weeks = []

    // Last 8 weeks
    for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date(today)
        weekEnd.setDate(today.getDate() - (i * 7))
        weekEnd.setHours(23, 59, 59, 999)

        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekEnd.getDate() - 6)
        weekStart.setHours(0, 0, 0, 0)

        weeks.push({
            label: `W${8 - i}`,
            start: weekStart,
            end: weekEnd
        })
    }

    // Optimization: Single Query
    const startDate = weeks[0].start
    const endDate = weeks[weeks.length - 1].end

    const payments = await prisma.payment.findMany({
        where: {
            invoice: { clinicId },
            paidAt: { gte: startDate, lte: endDate }
        },
        select: { amount: true, paidAt: true }
    })

    const data = weeks.map(w => {
        const total = payments
            .filter(p => {
                if (!p.paidAt) return false
                const d = new Date(p.paidAt)
                return d >= w.start && d <= w.end
            })
            .reduce((sum, p) => sum + Number(p.amount), 0)

        return { name: w.label, value: total }
    })

    return data
}

export async function getAppointmentStatusDistribution(clinicId: string) {
    const statusCounts = await prisma.appointment.groupBy({
        by: ['status'],
        where: { clinicId },
        _count: { status: true }
    })

    return statusCounts.map(item => ({
        name: item.status.charAt(0) + item.status.slice(1).toLowerCase(),
        value: item._count.status,
        color:
            item.status === 'COMPLETED' ? 'bg-emerald-500' :
                item.status === 'SCHEDULED' ? 'bg-blue-500' :
                    item.status === 'CANCELLED' ? 'bg-red-500' :
                        'bg-gray-500'
    }))
}

export async function getPatientGrowthData(clinicId: string) {
    const today = new Date()
    const months = []

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        months.push({
            label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
            start: startOfMonth(d),
            end: endOfMonth(d)
        })
    }

    // Optimization: Single Query
    const startDate = months[0].start
    const endDate = months[months.length - 1].end

    const patients = await prisma.patient.findMany({
        where: {
            clinicId,
            createdAt: { gte: startDate, lte: endDate }
        },
        select: { createdAt: true }
    })

    const data = months.map(m => {
        const count = patients.filter(p => {
            const d = new Date(p.createdAt)
            return d >= m.start && d <= m.end
        }).length
        return { name: m.label, value: count }
    })

    return data
}

export async function getPatientGrowthDataWeekly(clinicId: string) {
    const today = new Date()
    const weeks = []

    // Last 8 weeks
    for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date(today)
        weekEnd.setDate(today.getDate() - (i * 7))
        weekEnd.setHours(23, 59, 59, 999)

        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekEnd.getDate() - 6)
        weekStart.setHours(0, 0, 0, 0)

        weeks.push({
            label: `W${8 - i}`,
            start: weekStart,
            end: weekEnd
        })
    }

    // Optimization: Single Query
    const startDate = weeks[0].start
    const endDate = weeks[weeks.length - 1].end

    const patients = await prisma.patient.findMany({
        where: {
            clinicId,
            createdAt: { gte: startDate, lte: endDate }
        },
        select: { createdAt: true }
    })

    const data = weeks.map(w => {
        const count = patients.filter(p => {
            const d = new Date(p.createdAt)
            return d >= w.start && d <= w.end
        }).length
        return { name: w.label, value: count }
    })

    return data
}

export async function getTopServicesData(clinicId: string) {
    const topServices = await prisma.invoiceItem.groupBy({
        by: ['description'],
        where: { invoice: { clinicId } },
        _sum: { total: true },
        _count: { id: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
    })

    return topServices.map(service => ({
        name: service.description.length > 20 ? service.description.substring(0, 20) + '...' : service.description,
        revenue: Number(service._sum.total || 0),
        count: service._count.id
    }))
}

// Optimized Monthly Revenue Comparison (Single Query)
export async function getMonthlyComparisonData(clinicId: string) {
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    // Define date ranges
    const startOfCurrentYear = startOfYear(new Date(currentYear, 0, 1))
    const endOfCurrentYear = endOfYear(new Date(currentYear, 11, 31))
    const startOfLastYear = startOfYear(new Date(lastYear, 0, 1))
    const endOfLastYear = endOfYear(new Date(lastYear, 11, 31))

    // Fetch ALL payments for both years in a single query
    const payments = await prisma.payment.findMany({
        where: {
            invoice: { clinicId },
            paidAt: {
                gte: startOfLastYear, // Start from last year
                lte: endOfCurrentYear // End at current year
            }
        },
        select: {
            amount: true,
            paidAt: true
        }
    })

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Initialize aggregation map
    const chartData = months.map(month => ({
        month,
        thisYear: 0,
        lastYear: 0
    }))

    // Aggregate in memory
    for (const payment of payments) {
        if (!payment.paidAt) continue

        const date = new Date(payment.paidAt)
        const year = date.getFullYear()
        const monthIndex = date.getMonth() // 0-11
        const amount = Number(payment.amount)

        if (year === currentYear) {
            chartData[monthIndex].thisYear += amount
        } else if (year === lastYear) {
            chartData[monthIndex].lastYear += amount
        }
    }

    return chartData
}

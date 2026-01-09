

import prisma from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"

export async function getDashboardStats(clinicId: string) {
    const startOfCurrentMonth = startOfMonth(new Date())
    const endOfCurrentMonth = endOfMonth(new Date())
    const startOfLastMonth = startOfMonth(subMonths(new Date(), 1))
    const endOfLastMonth = endOfMonth(subMonths(new Date(), 1))

    const totalPatients = await prisma.patient.count({
        where: { clinicId },
    })

    // 2. Today's Appointments
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const appointmentsToday = await prisma.appointment.count({
        where: {
            clinicId,
            scheduledAt: {
                gte: today,
                lt: tomorrow,
            },
        },
    })

    const appointmentsCompletedToday = await prisma.appointment.count({
        where: {
            clinicId,
            status: "COMPLETED",
            scheduledAt: {
                gte: today,
                lt: tomorrow,
            },
        },
    })



    // 3. Total Revenue (All Time)
    const totalRevenue = await prisma.payment.aggregate({
        where: {
            invoice: { clinicId },
        },
        _sum: { amount: true },
    })

    const currentMonthRevenue = await prisma.payment.aggregate({
        where: {
            invoice: { clinicId },
            paidAt: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
        _sum: { amount: true },
    })

    const lastMonthRevenue = await prisma.payment.aggregate({
        where: {
            invoice: { clinicId },
            paidAt: {
                gte: startOfLastMonth,
                lte: endOfLastMonth,
            },
        },
        _sum: { amount: true },
    })

    // Decimal handling
    const totalRevenueValue = totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0
    const revenueValue = currentMonthRevenue._sum.amount ? Number(currentMonthRevenue._sum.amount) : 0
    const lastRevenueValue = lastMonthRevenue._sum.amount ? Number(lastMonthRevenue._sum.amount) : 0
    const revenueChange = lastRevenueValue === 0 ? 100 : ((revenueValue - lastRevenueValue) / lastRevenueValue) * 100

    // 4. Invoices Pending count
    const pendingInvoices = await prisma.invoice.count({
        where: {
            clinicId,
            status: { in: ["PENDING", "PARTIAL"] }
        }
    })


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
            change: `${appointmentsToday - appointmentsCompletedToday} remaining`,
            trend: "neutral",
            description: `${appointmentsCompletedToday} completed`,
        },
        {
            title: "Total Revenue", // Changed from "Revenue (This Month)"
            value: totalRevenueValue,
            change: `+${revenueValue.toLocaleString()} this month`, // Show monthly gain as 'change'
            trend: "up",
            description: "All time collected",
            isCurrency: true
        },
        {
            title: "Pending Invoices",
            value: pendingInvoices.toString(),
            change: "Needs attention",
            trend: "neutral",
            description: "Unpaid or partial",
        },
    ]
}

export async function getUpcomingAppointments(clinicId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await prisma.appointment.findMany({
        where: {
            clinicId,
            scheduledAt: { gte: today },
            status: { in: ["SCHEDULED", "CONFIRMED", "SEATED"] },
        },
        include: {
            patient: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
    })
}

export async function getRecentActivity(clinicId: string) {
    const recentCompleted = await prisma.appointment.findMany({
        where: {
            clinicId,
            status: "COMPLETED",
        },
        include: {
            patient: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
    })

    const recentPayments = await prisma.payment.findMany({
        where: {
            invoice: { clinicId },
        },
        include: {
            invoice: {
                include: {
                    patient: { select: { firstName: true, lastName: true } },
                }
            }
        },
        orderBy: { paidAt: "desc" },
        take: 3,
    })

    // Merge and sort
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const activities = [
        ...recentCompleted.map((a: any) => ({
            id: `apt-${a.id}`,
            patient: `${a.patient.firstName} ${a.patient.lastName}`,
            action: "completed",
            treatment: a.type,
            time: a.updatedAt,
        })),
        ...recentPayments.map((p: any) => ({
            id: `pay-${p.id}`,
            patient: `${p.invoice.patient.firstName} ${p.invoice.patient.lastName}`,
            action: "invoice",
            treatment: `Payment Received`,
            time: p.paidAt,
        })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5)

    return activities
}

export async function getRevenueChartData(clinicId: string) {
    const today = new Date()
    const months = []

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        months.push({
            date: d,
            label: d.toLocaleString('default', { month: 'short' }),
            start: startOfMonth(d),
            end: endOfMonth(d)
        })
    }

    const data = await Promise.all(months.map(async (m) => {
        const result = await prisma.payment.aggregate({
            where: {
                invoice: { clinicId },
                paidAt: {
                    gte: m.start,
                    lte: m.end
                }
            },
            _sum: { amount: true }
        })
        return {
            name: m.label,
            value: result._sum.amount ? Number(result._sum.amount) : 0
        }
    }))

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
            label: d.toLocaleString('default', { month: 'short' }),
            start: startOfMonth(d),
            end: endOfMonth(d)
        })
    }

    const data = await Promise.all(months.map(async (m) => {
        const count = await prisma.patient.count({
            where: {
                clinicId,
                createdAt: {
                    gte: m.start,
                    lte: m.end
                }
            }
        })
        return {
            name: m.label,
            value: count
        }
    }))

    return data
}

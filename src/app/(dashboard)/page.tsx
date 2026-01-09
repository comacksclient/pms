import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    Calendar,
    DollarSign,
    Clock,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react"
import {
    getDashboardStats,
    getUpcomingAppointments,
    getRecentActivity
} from "@/lib/actions/dashboard"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/sign-in")
    }

    if (!user.clinicId) {
        // User exists but no clinic - this shouldn't happen normally
        return (
            <div className="flex items-center justify-center h-screen">
                <p>No clinic associated with your account. Please contact support.</p>
            </div>
        )
    }

    const clinicId = user.clinicId
    const [stats, upcomingAppointments, recentActivity] = await Promise.all([
        getDashboardStats(clinicId),
        getUpcomingAppointments(clinicId),
        getRecentActivity(clinicId)
    ])

    return (
        <div className="flex flex-col">
            <Header
                title="Dashboard"
                description={`Welcome back, ${user.firstName} ${user.lastName}`}
            />

            <div className="flex-1 space-y-6 p-6">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                {stat.title.includes("Patients") ? <Users className="h-4 w-4 text-muted-foreground" /> :
                                    stat.title.includes("Appointments") ? <Calendar className="h-4 w-4 text-muted-foreground" /> :
                                        stat.title.includes("Revenue") ? <DollarSign className="h-4 w-4 text-muted-foreground" /> :
                                            <Clock className="h-4 w-4 text-muted-foreground" />}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {/* @ts-ignore dynamic property */}
                                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    {stat.trend === "up" && (
                                        <ArrowUpRight className="h-3 w-3 text-success" />
                                    )}
                                    {stat.trend === "down" && (
                                        <ArrowDownRight className="h-3 w-3 text-destructive" />
                                    )}
                                    <span
                                        className={`text-xs ${stat.trend === "up"
                                            ? "text-success"
                                            : stat.trend === "down"
                                                ? "text-destructive"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        {stat.change}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {' '}· {stat.description}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Upcoming Appointments */}
                    <Card className="lg:col-span-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <a
                                href="/schedule"
                                className="text-sm text-primary hover:underline"
                            >
                                View all
                            </a>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingAppointments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                        <Calendar className="mb-2 h-8 w-8 opacity-20" />
                                        <p>No upcoming appointments</p>
                                    </div>
                                ) : (
                                    upcomingAppointments.map((apt: any) => (
                                        <div
                                            key={apt.id}
                                            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                                    {apt.patient.firstName[0]}{apt.patient.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{apt.patient.firstName} {apt.patient.lastName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {apt.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium">
                                                    {format(new Date(apt.scheduledAt), "h:mm a")}
                                                </span>
                                                <Badge
                                                    variant={
                                                        apt.status.toLowerCase() as
                                                        | "scheduled"
                                                        | "confirmed"
                                                        | "seated"
                                                        | "default"
                                                    }
                                                >
                                                    {apt.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                        <Clock className="mb-2 h-8 w-8 opacity-20" />
                                        <p>No recent activity</p>
                                    </div>
                                ) : (
                                    recentActivity.map((activity: any) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-4 text-sm"
                                        >
                                            <div
                                                className={`mt-1 h-2 w-2 rounded-full ${activity.action === "completed"
                                                    ? "bg-success"
                                                    : activity.action === "invoice"
                                                        ? "bg-primary"
                                                        : "bg-warning"
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <p>
                                                    <span className="font-medium">{activity.patient}</span>
                                                    {" - "}
                                                    {activity.treatment}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {format(new Date(activity.time), "MMM d, h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue Chart Placeholder */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Revenue Overview</CardTitle>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="text-sm text-success">+23% this month</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                            <p className="text-muted-foreground">
                                Revenue chart will be displayed here
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

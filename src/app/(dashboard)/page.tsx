"use client"

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
} from "lucide-react"

// Mock stats data
const stats = [
    {
        title: "Total Patients",
        value: "1,247",
        change: "+12%",
        trend: "up",
        icon: Users,
        description: "vs last month",
    },
    {
        title: "Today's Appointments",
        value: "24",
        change: "8 remaining",
        trend: "neutral",
        icon: Calendar,
        description: "16 completed",
    },
    {
        title: "Revenue (This Month)",
        value: "₹4,52,300",
        change: "+23%",
        trend: "up",
        icon: DollarSign,
        description: "vs last month",
    },
    {
        title: "Avg. Wait Time",
        value: "12 min",
        change: "-3 min",
        trend: "up",
        icon: Clock,
        description: "vs last week",
    },
]

// Mock upcoming appointments
const upcomingAppointments = [
    {
        id: "1",
        patientName: "Rahul Sharma",
        time: "10:30 AM",
        type: "Root Canal",
        status: "confirmed",
    },
    {
        id: "2",
        patientName: "Priya Patel",
        time: "11:00 AM",
        type: "Cleaning",
        status: "scheduled",
    },
    {
        id: "3",
        patientName: "Amit Kumar",
        time: "11:30 AM",
        type: "Extraction",
        status: "confirmed",
    },
    {
        id: "4",
        patientName: "Sneha Gupta",
        time: "12:00 PM",
        type: "Check-up",
        status: "seated",
    },
]

// Mock recent activity
const recentActivity = [
    {
        id: "1",
        action: "completed",
        patient: "Meera Singh",
        treatment: "Scaling & Polishing",
        time: "2 hours ago",
    },
    {
        id: "2",
        action: "invoice",
        patient: "Raj Malhotra",
        treatment: "₹3,500 paid",
        time: "3 hours ago",
    },
    {
        id: "3",
        action: "booked",
        patient: "Anita Desai",
        treatment: "Consultation",
        time: "4 hours ago",
    },
]

export default function DashboardPage() {
    return (
        <div className="flex flex-col">
            <Header
                title="Dashboard"
                description="Welcome back, Dr. Smith"
                action={{
                    label: "New Appointment",
                    onClick: () => console.log("New appointment"),
                }}
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
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
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
                                        {stat.description}
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
                                {upcomingAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                                {apt.patientName.split(" ").map(n => n[0]).join("")}
                                            </div>
                                            <div>
                                                <p className="font-medium">{apt.patientName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {apt.type}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium">{apt.time}</span>
                                            <Badge
                                                variant={
                                                    apt.status as
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
                                ))}
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
                                {recentActivity.map((activity) => (
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
                                            <p className="text-muted-foreground">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
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

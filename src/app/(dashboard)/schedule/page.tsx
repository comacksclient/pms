"use client"

import { useState } from "react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Appointment {
    id: string
    time: string
    duration: number
    patientName: string
    type: string
    status: "scheduled" | "confirmed" | "seated" | "in-progress" | "completed" | "cancelled"
    doctor: string
}

// Mock appointments
const mockAppointments: Record<string, Appointment[]> = {
    "2026-01-07": [
        { id: "1", time: "09:00", duration: 30, patientName: "Rahul Sharma", type: "Root Canal", status: "completed", doctor: "Dr. Smith" },
        { id: "2", time: "09:30", duration: 30, patientName: "Priya Patel", type: "Cleaning", status: "completed", doctor: "Dr. Smith" },
        { id: "3", time: "10:00", duration: 45, patientName: "Amit Kumar", type: "Extraction", status: "in-progress", doctor: "Dr. Smith" },
        { id: "4", time: "11:00", duration: 30, patientName: "Sneha Gupta", type: "Check-up", status: "seated", doctor: "Dr. Smith" },
        { id: "5", time: "11:30", duration: 30, patientName: "Vikram Singh", type: "Filling", status: "confirmed", doctor: "Dr. Smith" },
        { id: "6", time: "12:00", duration: 30, patientName: "Meera Singh", type: "Consultation", status: "scheduled", doctor: "Dr. Smith" },
        { id: "7", time: "14:00", duration: 60, patientName: "Raj Malhotra", type: "Root Canal", status: "scheduled", doctor: "Dr. Smith" },
        { id: "8", time: "15:00", duration: 30, patientName: "Anita Desai", type: "Cleaning", status: "scheduled", doctor: "Dr. Smith" },
    ],
    "2026-01-08": [
        { id: "9", time: "09:00", duration: 30, patientName: "Karan Mehta", type: "Check-up", status: "scheduled", doctor: "Dr. Smith" },
        { id: "10", time: "10:00", duration: 45, patientName: "Pooja Sharma", type: "Crown Fitting", status: "scheduled", doctor: "Dr. Smith" },
        { id: "11", time: "11:00", duration: 30, patientName: "Arun Kumar", type: "Cleaning", status: "scheduled", doctor: "Dr. Smith" },
    ],
}

const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
]

export default function SchedulePage() {
    const [currentDate, setCurrentDate] = useState(new Date("2026-01-07"))
    const [view, setView] = useState<"day" | "week">("day")

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const getAppointmentsForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        return mockAppointments[dateStr] || []
    }

    const navigateDate = (direction: "prev" | "next") => {
        const days = view === "week" ? 7 : 1
        setCurrentDate(direction === "prev" ? addDays(currentDate, -days) : addDays(currentDate, days))
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-100 border-emerald-300 text-emerald-700"
            case "in-progress": return "bg-purple-100 border-purple-300 text-purple-700"
            case "seated": return "bg-amber-100 border-amber-300 text-amber-700"
            case "confirmed": return "bg-green-100 border-green-300 text-green-700"
            case "scheduled": return "bg-blue-100 border-blue-300 text-blue-700"
            case "cancelled": return "bg-red-100 border-red-300 text-red-700"
            default: return "bg-gray-100 border-gray-300 text-gray-700"
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Schedule"
                description={format(currentDate, "EEEE, MMMM d, yyyy")}
                action={{
                    label: "New Appointment",
                    onClick: () => console.log("New appointment"),
                }}
            />

            <div className="flex-1 flex flex-col overflow-hidden p-6">
                {/* Controls */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentDate(new Date("2026-01-07"))}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex gap-1 rounded-lg border p-1">
                        <Button
                            variant={view === "day" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("day")}
                        >
                            Day
                        </Button>
                        <Button
                            variant={view === "week" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("week")}
                        >
                            Week
                        </Button>
                    </div>
                </div>

                {/* Calendar */}
                <Card className="flex-1 overflow-hidden">
                    <CardContent className="p-0 h-full overflow-auto">
                        {view === "day" ? (
                            // Day View
                            <div className="divide-y">
                                {timeSlots.map((time) => {
                                    const appointments = getAppointmentsForDate(currentDate).filter(a => a.time === time)
                                    return (
                                        <div key={time} className="flex min-h-[60px]">
                                            <div className="w-20 flex-shrink-0 p-2 text-sm text-muted-foreground border-r bg-muted/30">
                                                {time}
                                            </div>
                                            <div className="flex-1 p-2">
                                                {appointments.map((apt) => (
                                                    <div
                                                        key={apt.id}
                                                        className={cn(
                                                            "rounded-lg border p-3 mb-2 cursor-pointer transition-colors hover:shadow-md",
                                                            getStatusColor(apt.status)
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{apt.patientName}</span>
                                                            <Badge variant={apt.status as "scheduled" | "confirmed" | "seated" | "completed"}>
                                                                {apt.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-sm opacity-80">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {apt.duration} min
                                                            </span>
                                                            <span>{apt.type}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            // Week View
                            <div className="flex flex-col h-full">
                                {/* Week Header */}
                                <div className="flex border-b sticky top-0 bg-background z-10">
                                    <div className="w-20 flex-shrink-0 border-r" />
                                    {weekDays.map((day) => (
                                        <div
                                            key={day.toISOString()}
                                            className={cn(
                                                "flex-1 p-2 text-center border-r last:border-r-0",
                                                isSameDay(day, new Date("2026-01-07")) && "bg-primary/5"
                                            )}
                                        >
                                            <div className="text-sm font-medium">{format(day, "EEE")}</div>
                                            <div className={cn(
                                                "text-2xl font-bold",
                                                isSameDay(day, new Date("2026-01-07")) && "text-primary"
                                            )}>
                                                {format(day, "d")}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Week Grid */}
                                <div className="flex-1 overflow-auto">
                                    {timeSlots.map((time) => (
                                        <div key={time} className="flex border-b min-h-[50px]">
                                            <div className="w-20 flex-shrink-0 p-1 text-xs text-muted-foreground border-r bg-muted/30">
                                                {time}
                                            </div>
                                            {weekDays.map((day) => {
                                                const appointments = getAppointmentsForDate(day).filter(a => a.time === time)
                                                return (
                                                    <div
                                                        key={day.toISOString()}
                                                        className={cn(
                                                            "flex-1 p-1 border-r last:border-r-0",
                                                            isSameDay(day, new Date("2026-01-07")) && "bg-primary/5"
                                                        )}
                                                    >
                                                        {appointments.map((apt) => (
                                                            <div
                                                                key={apt.id}
                                                                className={cn(
                                                                    "rounded px-2 py-1 text-xs cursor-pointer truncate",
                                                                    getStatusColor(apt.status)
                                                                )}
                                                            >
                                                                {apt.patientName}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

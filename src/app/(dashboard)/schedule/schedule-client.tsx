"use client"

import { useState, useEffect } from "react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDoctors } from "@/lib/actions/users"
import { getPatients } from "@/lib/actions/patients"
import { createAppointment, getAppointments } from "@/lib/actions/appointments"
import { generateInvoiceFromAppointment } from "@/lib/actions/invoices"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"

interface Appointment {
    id: string
    scheduledAt: Date
    duration: number
    type: string
    status: string
    patient: {
        firstName: string
        lastName: string
    }
    doctor: {
        firstName: string
        lastName: string
    }
}

const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
]

export function ScheduleClient({ clinicId }: { clinicId: string }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [view, setView] = useState<"day" | "week">("day")
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
    const router = useRouter()
    // const { toast } = useToast() // Uncomment if toast component exists
    const [doctors, setDoctors] = useState<{ id: string; firstName: string; lastName: string }[]>([])
    const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [docs, pats] = await Promise.all([
                    getDoctors(clinicId),
                    getPatients(clinicId, "").then(res => res)
                ])
                setDoctors(docs)
                setPatients(pats.map((p: any) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName })))
            } catch (error) {
                console.error("Failed to load form data", error)
            }
        }
        loadData()
    }, [])

    // Fetch appointments when date or view changes
    useEffect(() => {
        const fetchAppointments = async () => {
            // Avoid infinite loop by not depending on 'appointments'
            // but we rely on currentDate and view

            try {
                let res;
                if (view === "day") {
                    res = await getAppointments(clinicId, { date: currentDate })
                } else {
                    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
                    const end = addDays(start, 6)
                    res = await getAppointments(clinicId, { startDate: start, endDate: end })
                }

                const formatted = res.map((apt: any) => ({
                    ...apt,
                    scheduledAt: new Date(apt.scheduledAt)
                })) as unknown as Appointment[]
                setAppointments(formatted)
            } catch (error) {
                console.error("Failed to load appointments", error)
            }
        }
        fetchAppointments()
    }, [currentDate, view, clinicId])

    const getAppointmentsForDate = (date: Date) => {
        // We need to match day, month, year
        return appointments.filter(apt => isSameDay(new Date(apt.scheduledAt), date))
    }

    const navigateDate = (direction: "prev" | "next") => {
        const days = view === "week" ? 7 : 1
        setCurrentDate(direction === "prev" ? addDays(currentDate, -days) : addDays(currentDate, days))
    }

    const handleCreateAppointment = async (data: any) => {
        setIsLoading(true)
        try {
            await createAppointment(clinicId, data)
            setIsNewAppointmentOpen(false)
            // Refresh appointments
            const res = await getAppointments(clinicId, { date: currentDate })
            const formatted = res.map((apt: any) => ({
                ...apt,
                scheduledAt: new Date(apt.scheduledAt)
            })) as unknown as Appointment[]
            setAppointments(formatted)
        } catch (error) {
            console.error("Failed to create appointment", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateInvoice = async (appointmentId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent opening appointment details if we add that later
        setIsLoading(true)
        try {
            await generateInvoiceFromAppointment(appointmentId, clinicId)
            // Redirect to billing to see the new invoice
            router.push("/billing")
        } catch (error) {
            console.error("Failed to create invoice", error)
            alert("Failed to create invoice. Make sure clinical records exist for this appointment.")
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "bg-emerald-100 border-emerald-300 text-emerald-700"
            case "IN_PROGRESS": return "bg-purple-100 border-purple-300 text-purple-700"
            case "SEATED": return "bg-amber-100 border-amber-300 text-amber-700"
            case "CONFIRMED": return "bg-green-100 border-green-300 text-green-700"
            case "SCHEDULED": return "bg-blue-100 border-blue-300 text-blue-700"
            case "CANCELLED": return "bg-red-100 border-red-300 text-red-700"
            case "NO_SHOW": return "bg-gray-100 border-gray-300 text-gray-700"
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
                    onClick: () => setIsNewAppointmentOpen(true),
                }}
            />

            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Appointment</DialogTitle>
                    </DialogHeader>
                    <AppointmentForm
                        clinicId={clinicId}
                        patients={patients}
                        onSubmit={handleCreateAppointment}
                        onCancel={() => setIsNewAppointmentOpen(false)}
                        isLoading={isLoading}
                    />
                </DialogContent>
            </Dialog>

            <div className="flex-1 flex flex-col overflow-hidden p-6">
                {/* Controls */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
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
                                    const slotAppointments = getAppointmentsForDate(currentDate).filter(a =>
                                        format(a.scheduledAt, "HH:mm") === time
                                    )
                                    return (
                                        <div key={time} className="flex min-h-[60px]">
                                            <div className="w-20 flex-shrink-0 p-2 text-sm text-muted-foreground border-r bg-muted/30">
                                                {time}
                                            </div>
                                            <div className="flex-1 p-2">
                                                {slotAppointments.map((apt) => (
                                                    <div
                                                        key={apt.id}
                                                        className={cn(
                                                            "rounded-lg border p-3 mb-2 cursor-pointer transition-colors hover:shadow-md",
                                                            getStatusColor(apt.status)
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{apt.patient.firstName} {apt.patient.lastName}</span>
                                                            <Badge variant="outline" className="bg-white/50">
                                                                {apt.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-sm opacity-80">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {apt.duration} min
                                                            </span>
                                                            <span>{apt.type}</span>
                                                            <span className="text-xs">With Dr. {apt.doctor.lastName}</span>
                                                        </div>
                                                        <div className="flex justify-end mt-2">
                                                            {apt.status === "COMPLETED" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-6 gap-1"
                                                                    onClick={(e) => handleCreateInvoice(apt.id, e)}
                                                                >
                                                                    <CreditCard className="h-3 w-3" />
                                                                    Bill
                                                                </Button>
                                                            )}
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
                                                isSameDay(day, new Date()) && "bg-primary/5"
                                            )}
                                        >
                                            <div className="text-sm font-medium">{format(day, "EEE")}</div>
                                            <div className={cn(
                                                "text-2xl font-bold",
                                                isSameDay(day, new Date()) && "text-primary"
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
                                                const slotAppointments = getAppointmentsForDate(day).filter(a =>
                                                    format(a.scheduledAt, "HH:mm") === time
                                                )
                                                return (
                                                    <div
                                                        key={day.toISOString()}
                                                        className={cn(
                                                            "flex-1 p-1 border-r last:border-r-0",
                                                            isSameDay(day, new Date()) && "bg-primary/5"
                                                        )}
                                                    >
                                                        {slotAppointments.map((apt) => (
                                                            <div
                                                                key={apt.id}
                                                                className={cn(
                                                                    "rounded px-2 py-1 text-xs cursor-pointer truncate mb-1",
                                                                    getStatusColor(apt.status)
                                                                )}
                                                                title={`${apt.patient.firstName} - ${apt.type}`}
                                                            >
                                                                {apt.patient.firstName}
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

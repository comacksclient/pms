"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { format, addDays, startOfWeek, isSameDay, setHours, setMinutes } from "date-fns"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AppointmentForm } from "@/components/appointments/appointment-form"
import { ChevronLeft, ChevronRight, Clock, Filter, Eye, EyeOff, Edit, Check, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDoctors } from "@/lib/actions/users"
import { getPatients } from "@/lib/actions/patients"
import { createAppointment, updateAppointment, updateAppointmentStatus } from "@/lib/actions/appointments"
import { generateInvoiceFromAppointment } from "@/lib/actions/invoices"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTreatments } from "@/lib/actions/treatments"

// Common treatment types
const TREATMENT_TYPES = [
    "General Consultation",
    "Dental Cleaning",
    "Root Canal Treatment",
    "Tooth Extraction",
    "Dental Filling",
    "Crown & Bridge",
    "Teeth Whitening",
    "Orthodontic Consultation",
    "Dental Implant",
    "Gum Treatment",
    "Wisdom Tooth Removal",
    "Dental X-Ray",
    "Emergency Treatment",
    "Follow-up Visit",
    "Other"
]


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

// Generate time slots (every 30 minutes)
const ALL_TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

// Filter for working hours (8 AM to 8 PM)
const WORKING_HOURS_SLOTS = ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0])
    return hour >= 8 && hour < 20
})

export function ScheduleClient({ clinicId, initialAppointments }: {
    clinicId: string
    initialAppointments: any[]
}) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<"day" | "week">("day")
    const [showFullDay, setShowFullDay] = useState(false)
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
    const [doctors, setDoctors] = useState<{ id: string; firstName: string; lastName: string }[]>([])
    const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Edit appointment state
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
    const [editForm, setEditForm] = useState({
        date: "",
        time: "",
        type: "",
        duration: 30,
        notes: "",
        status: "SCHEDULED" as "SCHEDULED" | "CONFIRMED" | "SEATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
    })


    const timeSlots = showFullDay ? ALL_TIME_SLOTS : WORKING_HOURS_SLOTS

    const appointments = useMemo(() => {
        return initialAppointments.map((apt: any) => ({
            ...apt,
            scheduledAt: new Date(apt.scheduledAt)
        })) as Appointment[]
    }, [initialAppointments])

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const hasAppointmentsOutsideWorkingHours = (date: Date) => {
        return appointments.some((apt: Appointment) => {
            if (!isSameDay(apt.scheduledAt, date)) return false
            const hour = apt.scheduledAt.getHours()
            return hour < 8 || hour >= 20
        })
    }

    // Auto-scroll and auto-expand if data exists outside working hours
    useEffect(() => {
        if (hasAppointmentsOutsideWorkingHours(currentDate) && !showFullDay) {
            setShowFullDay(true)
        }
    }, [currentDate, appointments])

    // Auto-scroll to current time or start of working hours
    useEffect(() => {
        if (scrollContainerRef.current) {
            const now = new Date()
            const currentHour = now.getHours()
            const startHour = showFullDay ? 0 : 8

            // Find the slot to scroll to
            const scrollHour = Math.max(startHour, currentHour - 1)
            const slotIndex = timeSlots.findIndex(s => parseInt(s.split(':')[0]) === scrollHour)

            if (slotIndex !== -1) {
                const slotHeight = view === "day" ? 80 : 90
                scrollContainerRef.current.scrollTop = slotIndex * slotHeight
            }
        }
    }, [showFullDay, view, timeSlots])

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
    }, [clinicId])

    const getAppointmentsForDate = (date: Date) => {
        return appointments.filter((apt: Appointment) => isSameDay(apt.scheduledAt, date))
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
            router.refresh()
        } catch (error) {
            console.error("Failed to create appointment", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateInvoice = async (appointmentId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setIsLoading(true)
        try {
            await generateInvoiceFromAppointment(appointmentId, clinicId)
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
            case "COMPLETED": return "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            case "IN_PROGRESS": return "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            case "SEATED": return "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            case "CONFIRMED": return "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            case "SCHEDULED": return "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            case "CANCELLED": return "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            case "NO_SHOW": return "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            default: return "bg-gray-50 border-gray-200 text-gray-700"
        }
    }

    // Open edit dialog
    const handleEditClick = (apt: Appointment, e: React.MouseEvent) => {
        e.stopPropagation()
        const aptDate = new Date(apt.scheduledAt)
        setEditForm({
            date: format(aptDate, "yyyy-MM-dd"),
            time: format(aptDate, "HH:mm"),
            type: apt.type,
            duration: apt.duration,
            notes: "",
            status: apt.status as "SCHEDULED" | "CONFIRMED" | "SEATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
        })
        setEditingAppointment(apt)
    }

    // Save edited appointment
    const handleSaveEdit = async () => {
        if (!editingAppointment) return
        setIsLoading(true)
        try {
            const [hours, mins] = editForm.time.split(":").map(Number)
            const newDate = new Date(editForm.date)
            newDate.setHours(hours, mins, 0, 0)

            await updateAppointment(editingAppointment.id, {
                scheduledAt: newDate,
                type: editForm.type,
                duration: editForm.duration
            })

            // Update status if it changed
            if (editForm.status !== editingAppointment.status) {
                await updateAppointmentStatus(editingAppointment.id, editForm.status)
            }

            setEditingAppointment(null)
            router.refresh()
        } catch (error) {
            console.error("Failed to update appointment", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Change appointment status
    const handleStatusChange = async (appointmentId: string, newStatus: "SCHEDULED" | "CONFIRMED" | "SEATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW", e: React.MouseEvent) => {
        e.stopPropagation()
        setIsLoading(true)
        try {
            await updateAppointmentStatus(appointmentId, newStatus)
            router.refresh()
        } catch (error) {
            console.error("Failed to update status", error)
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            <Header
                title="Schedule"
                description={format(currentDate, "EEEE, MMMM d, yyyy")}
                clinicId={clinicId}
                action={{
                    label: "New Appointment",
                    onClick: () => setIsNewAppointmentOpen(true),
                }}
            />

            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Appointment</DialogTitle>
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

            {/* Edit Appointment Dialog */}
            <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Appointment</DialogTitle>
                        <DialogDescription>
                            {editingAppointment?.patient.firstName} {editingAppointment?.patient.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-date">Date</Label>
                                <Input
                                    id="edit-date"
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-time">Time</Label>
                                <Input
                                    id="edit-time"
                                    type="time"
                                    value={editForm.time}
                                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Treatment Type</Label>
                            <Select
                                value={editForm.type}
                                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select treatment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TREATMENT_TYPES.map((treatment) => (
                                        <SelectItem key={treatment} value={treatment}>
                                            {treatment}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-duration">Duration (minutes)</Label>
                            <Input
                                id="edit-duration"
                                type="number"
                                value={editForm.duration}
                                onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 30 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={editForm.status}
                                onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom">
                                    <SelectItem value="SCHEDULED">🔵 Scheduled</SelectItem>
                                    <SelectItem value="CONFIRMED">✅ Confirmed</SelectItem>
                                    <SelectItem value="SEATED">🪑 Seated</SelectItem>
                                    <SelectItem value="IN_PROGRESS">🏥 In Progress</SelectItem>
                                    <SelectItem value="COMPLETED">✔️ Completed</SelectItem>
                                    <SelectItem value="CANCELLED">❌ Cancelled</SelectItem>
                                    <SelectItem value="NO_SHOW">⚠️ No Show</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAppointment(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 lg:p-8">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white rounded-lg border shadow-sm p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate("prev")}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="px-3" onClick={() => setCurrentDate(new Date())}>
                                Today
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate("next")}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="ml-2 text-lg font-semibold text-slate-800 hidden sm:block">
                            {view === "week" ? (
                                `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
                            ) : (
                                format(currentDate, "MMMM yyyy")
                            )}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-white"
                            onClick={() => setShowFullDay(!showFullDay)}
                        >
                            {showFullDay ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {showFullDay ? "Working Hours" : "Full Day"}
                        </Button>

                        <div className="flex gap-1 bg-white rounded-lg border shadow-sm p-1">
                            <Button
                                variant={view === "day" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 px-4"
                                onClick={() => setView("day")}
                            >
                                Day
                            </Button>
                            <Button
                                variant={view === "week" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 px-4"
                                onClick={() => setView("week")}
                            >
                                Week
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Calendar Content */}
                <Card className="flex-1 overflow-hidden border-slate-200 shadow-xl rounded-xl">
                    <CardContent className="p-0 h-full flex flex-col">
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-auto scroll-smooth"
                        >
                            {view === "day" ? (
                                <div className="divide-y divide-slate-100">
                                    {timeSlots.map((time) => {
                                        const [slotHour, slotMinute] = time.split(':').map(Number)
                                        const slotTotalMinutes = slotHour * 60 + slotMinute

                                        const dayAppointments = getAppointmentsForDate(currentDate)
                                        const slotAppointments = dayAppointments.filter((a: Appointment) => {
                                            const aptDate = new Date(a.scheduledAt)
                                            const aptHour = aptDate.getHours()
                                            const aptMinute = aptDate.getMinutes()
                                            const aptTotalMinutes = aptHour * 60 + aptMinute
                                            return aptTotalMinutes >= slotTotalMinutes && aptTotalMinutes < slotTotalMinutes + 30
                                        })

                                        return (
                                            <div key={time} className="flex min-h-[80px] group transition-colors hover:bg-slate-50/80">
                                                <div className="w-24 flex-shrink-0 flex items-start justify-center pt-4 border-r border-slate-100 bg-slate-50/50">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        {time}
                                                    </span>
                                                </div>
                                                <div className="flex-1 p-3 grid gap-3">
                                                    {slotAppointments.length > 0 ? (
                                                        slotAppointments.map((apt: Appointment) => (
                                                            <div
                                                                key={apt.id}
                                                                className={cn(
                                                                    "group/apt relative rounded-xl border-l-4 p-4 shadow-sm transition-all hover:shadow-md",
                                                                    getStatusColor(apt.status)
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="font-bold text-slate-900">
                                                                                {apt.patient.firstName} {apt.patient.lastName}
                                                                            </h3>
                                                                            <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5 font-bold uppercase tracking-tight bg-white">
                                                                                {apt.type}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-600">
                                                                            <span className="flex items-center gap-1.5 font-medium">
                                                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                                {format(new Date(apt.scheduledAt), "h:mm a")} ({apt.duration}m)
                                                                            </span>
                                                                            <span className="flex items-center gap-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                                                Dr. {apt.doctor.lastName}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-col items-end gap-2">
                                                                        {/* Status with quick actions */}
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-6 w-6 p-0"
                                                                                onClick={(e) => handleEditClick(apt, e)}
                                                                                title="Edit Appointment"
                                                                            >
                                                                                <Edit className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="h-6 font-bold text-[10px] uppercase bg-white/80"
                                                                            >
                                                                                {apt.status}
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Status change buttons */}
                                                                        <div className="flex gap-1">
                                                                            {apt.status === "SCHEDULED" && (
                                                                                <>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        className="h-7 px-2 text-xs gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                                                                        onClick={(e) => handleStatusChange(apt.id, "CONFIRMED", e)}
                                                                                    >
                                                                                        <Check className="h-3 w-3" />
                                                                                        Confirm
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        className="h-7 px-2 text-xs gap-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                                                                        onClick={(e) => handleStatusChange(apt.id, "CANCELLED", e)}
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            {apt.status === "CONFIRMED" && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="h-7 px-2 text-xs gap-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                                                                    onClick={(e) => handleStatusChange(apt.id, "SEATED", e)}
                                                                                >
                                                                                    Patient Seated
                                                                                </Button>
                                                                            )}
                                                                            {apt.status === "SEATED" && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="h-7 px-2 text-xs gap-1 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                                                                    onClick={(e) => handleStatusChange(apt.id, "IN_PROGRESS", e)}
                                                                                >
                                                                                    Start Treatment
                                                                                </Button>
                                                                            )}
                                                                            {apt.status === "IN_PROGRESS" && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="default"
                                                                                    className="h-7 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                                                    onClick={(e) => handleStatusChange(apt.id, "COMPLETED", e)}
                                                                                >
                                                                                    <Check className="h-3 w-3" />
                                                                                    Complete
                                                                                </Button>
                                                                            )}
                                                                            {apt.status === "COMPLETED" && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="default"
                                                                                    className="h-7 px-2 text-xs font-bold gap-1 shadow-sm"
                                                                                    onClick={(e) => handleCreateInvoice(apt.id, e)}
                                                                                >
                                                                                    <CreditCard className="h-3 w-3" />
                                                                                    Bill
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="h-full w-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                            <Button variant="ghost" size="sm" className="text-slate-400 text-xs gap-1" onClick={() => setIsNewAppointmentOpen(true)}>
                                                                <Clock className="h-3 w-3" />
                                                                Quick Slot
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col h-full min-w-[1000px]">
                                    {/* Week Header */}
                                    <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20 shadow-sm">
                                        <div className="w-24 flex-shrink-0 border-r border-slate-100" />
                                        {weekDays.map((day) => {
                                            const isToday = isSameDay(day, new Date())
                                            return (
                                                <div
                                                    key={day.toISOString()}
                                                    className={cn(
                                                        "flex-1 py-4 text-center border-r border-slate-100 last:border-r-0",
                                                        isToday && "bg-blue-50/30"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "text-xs font-bold uppercase tracking-widest mb-1",
                                                        isToday ? "text-blue-600" : "text-slate-500"
                                                    )}>
                                                        {format(day, "EEE")}
                                                    </div>
                                                    <div className={cn(
                                                        "inline-flex items-center justify-center w-10 h-10 rounded-full text-xl font-black",
                                                        isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-800"
                                                    )}>
                                                        {format(day, "d")}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Week Grid */}
                                    <div className="divide-y divide-slate-100 bg-white">
                                        {timeSlots.map((time) => {
                                            const [slotHour, slotMinute] = time.split(':').map(Number)
                                            const slotTotalMinutes = slotHour * 60 + slotMinute

                                            return (
                                                <div key={time} className="flex min-h-[90px] group">
                                                    <div className="w-24 flex-shrink-0 flex items-start justify-center pt-2 border-r border-slate-100 bg-slate-50/30">
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {time}
                                                        </span>
                                                    </div>
                                                    {weekDays.map((day) => {
                                                        const dayAppointments = getAppointmentsForDate(day)
                                                        const slotAppointments = dayAppointments.filter((a: Appointment) => {
                                                            const aptDate = new Date(a.scheduledAt)
                                                            const aptHour = aptDate.getHours()
                                                            const aptMinute = aptDate.getMinutes()
                                                            const aptTotalMinutes = aptHour * 60 + aptMinute
                                                            return aptTotalMinutes >= slotTotalMinutes && aptTotalMinutes < slotTotalMinutes + 30
                                                        })

                                                        return (
                                                            <div
                                                                key={day.toISOString()}
                                                                className={cn(
                                                                    "flex-1 p-1 border-r border-slate-100 last:border-r-0 group-hover:bg-slate-50/30 transition-colors",
                                                                    isSameDay(day, new Date()) && "bg-blue-50/10"
                                                                )}
                                                            >
                                                                {slotAppointments.map((apt: Appointment) => (
                                                                    <div
                                                                        key={apt.id}
                                                                        className={cn(
                                                                            "rounded-lg border-l-2 p-2 mb-1 cursor-pointer shadow-sm overflow-hidden hover:shadow-md transition-shadow",
                                                                            getStatusColor(apt.status)
                                                                        )}
                                                                        title={`${apt.patient.firstName} ${apt.patient.lastName} - ${apt.type} with Dr. ${apt.doctor.lastName} (Click to edit)`}
                                                                        onClick={(e) => handleEditClick(apt, e)}
                                                                    >
                                                                        <p className="font-bold text-[11px] leading-tight truncate text-slate-900">
                                                                            {apt.patient.firstName}
                                                                        </p>
                                                                        <div className="flex items-center gap-1 mt-0.5 opacity-80 overflow-hidden">
                                                                            <span className="text-[9px] font-bold truncate">
                                                                                {format(new Date(apt.scheduledAt), "h:mm a")}
                                                                            </span>
                                                                            <Badge variant="outline" className="text-[8px] h-4 px-1">
                                                                                {apt.status}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

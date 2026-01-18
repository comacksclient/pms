import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const data = await req.json()

        console.log("Received booking data:", data)

        // Extract form data - handle both direct and nested formats
        const formData = data.data || data
        const {
            fullName,
            phoneNumber,
            age,
            gender,
            address,
            dentalService,
            date,
            time,
        } = formData

        // Validate required fields
        if (!fullName || !phoneNumber || !date || !time) {
            console.error("Missing required fields:", { fullName, phoneNumber, date, time })
            return NextResponse.json(
                { success: false, error: "Missing required fields: fullName, phoneNumber, date, time" },
                { status: 400 }
            )
        }

        // Parse name into first and last name
        const nameParts = fullName.trim().split(" ")
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(" ") || ""

        // Format phone number - ensure it has country code
        let formattedPhone = phoneNumber.trim()
        if (!formattedPhone.startsWith("+")) {
            // Assume India if no country code
            formattedPhone = "+91" + formattedPhone.replace(/^0+/, "")
        }

        // Get the first clinic (default clinic)
        const clinic = await prisma.clinic.findFirst()

        if (!clinic) {
            console.error("No clinic found in system")
            return NextResponse.json(
                { success: false, error: "No clinic configured in system" },
                { status: 500 }
            )
        }

        console.log("Processing for clinic:", clinic.id, clinic.name)

        // Check if patient exists by phone number
        let patient = await prisma.patient.findFirst({
            where: {
                clinicId: clinic.id,
                phone: {
                    contains: formattedPhone.replace(/[\s\-\(\)]/g, "").slice(-10) // Match last 10 digits
                }
            }
        })

        // Create or update patient
        if (patient) {
            console.log("Updating existing patient:", patient.id)
            patient = await prisma.patient.update({
                where: { id: patient.id },
                data: {
                    firstName,
                    lastName,
                    ...(age && { age: parseInt(age) }),
                    ...(gender && { gender }),
                    ...(address && { address }),
                }
            })
        } else {
            console.log("Creating new patient")
            patient = await prisma.patient.create({
                data: {
                    firstName,
                    lastName,
                    phone: formattedPhone,
                    ...(age && { age: parseInt(age) }),
                    ...(gender && { gender }),
                    ...(address && { address }),
                    clinicId: clinic.id,
                }
            })
        }

        console.log("Patient processed:", patient.id)

        // Parse date and time
        const appointmentDate = new Date(date)
        const [hours, minutes] = time.split(":").map(Number)
        appointmentDate.setHours(hours, minutes, 0, 0)

        console.log("Scheduling appointment for:", appointmentDate)

        // Check if appointment already exists
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                patientId: patient.id,
                scheduledAt: appointmentDate,
            }
        })

        if (existingAppointment) {
            console.log("Appointment already exists:", existingAppointment.id)
            return NextResponse.json({
                success: true,
                message: "Booking already exists",
                patientId: patient.id,
                appointmentId: existingAppointment.id,
                duplicate: true
            })
        }

        // Create appointment
        const appointment = await prisma.appointment.create({
            data: {
                doctorId: "",
                patientId: patient.id,
                clinicId: clinic.id,
                scheduledAt: appointmentDate,
                type: dentalService || "General Consultation",
                status: "SCHEDULED",
                duration: 30,
                notes: `Online booking${dentalService ? ` - ${dentalService}` : ""}`
            }
        })

        console.log("Appointment created:", appointment.id)

        return NextResponse.json({
            success: true,
            message: "Booking confirmed successfully!",
            patientId: patient.id,
            appointmentId: appointment.id,
            duplicate: false
        })

    } catch (error) {
        console.error("Webhook error:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to process booking",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}

// Allow GET requests to verify webhook is working
export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Booking webhook endpoint is active",
        timestamp: new Date().toISOString()
    })
}

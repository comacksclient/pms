
import { getAllTreatments } from "@/lib/actions/treatments"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TreatmentsClient } from "./treatments-client"

export const dynamic = "force-dynamic"

export default async function TreatmentsPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/sign-in")
    }

    if (!user.clinicId) {
        return <div>No clinic associated</div>
    }

    // Pass casted type if needed, but getTreatments returns array compatible with Treatment interface mostly
    const treatments = await getAllTreatments(user.clinicId)

    return <TreatmentsClient initialTreatments={treatments as any} clinicId={user.clinicId} />
}

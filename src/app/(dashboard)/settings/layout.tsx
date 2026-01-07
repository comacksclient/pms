"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import { Settings, Stethoscope, Users, Building2, Bell } from "lucide-react"

const settingsNav = [
    {
        title: "General",
        href: "/settings",
        icon: Settings,
    },
    {
        title: "Treatment Catalog",
        href: "/settings/treatments",
        icon: Stethoscope,
    },
    {
        title: "Staff & Roles",
        href: "/settings/staff",
        icon: Users,
    },
    {
        title: "Clinic Info",
        href: "/settings/clinic",
        icon: Building2,
    },
    {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
    },
]

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full">
            <Header title="Settings" description="Manage your clinic settings" />

            <div className="flex flex-1 overflow-hidden">
                {/* Settings Sidebar */}
                <nav className="w-64 border-r bg-muted/30 p-4">
                    <div className="space-y-1">
                        {settingsNav.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* Settings Content */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Calendar,
    Users,
    Receipt,
    Settings,
    Stethoscope,
    LogOut,
    ChevronLeft,
    Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"

const navigationItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Schedule",
        href: "/schedule",
        icon: Calendar,
    },
    {
        title: "Patients",
        href: "/patients",
        icon: Users,
    },
    {
        title: "Billing",
        href: "/billing",
        icon: Receipt,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
]

interface SidebarProps {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div
            className={cn(
                "relative flex flex-col bg-sidebar-background text-sidebar-foreground transition-all duration-300",
                collapsed ? "w-16" : "w-64",
                className
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                    <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">DentalPMS</span>
                        <span className="text-xs text-sidebar-foreground/60">Practice Manager</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "ml-auto h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent",
                        collapsed && "absolute -right-3 top-6 z-10 rounded-full bg-sidebar-background border border-sidebar-border"
                    )}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <Menu className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="flex flex-col gap-1">
                    {navigationItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && pathname?.startsWith(item.href))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* User section */}
            <div className="border-t border-sidebar-border p-3">
                <div className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2",
                    collapsed && "justify-center"
                )}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                            DR
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium">Dr. Smith</span>
                            <span className="truncate text-xs text-sidebar-foreground/60">Doctor</span>
                        </div>
                    )}
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

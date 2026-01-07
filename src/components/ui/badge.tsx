import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground",
                secondary: "border-transparent bg-secondary text-secondary-foreground",
                destructive: "border-transparent bg-destructive text-destructive-foreground",
                outline: "text-foreground",
                success: "border-transparent bg-success text-success-foreground",
                warning: "border-transparent bg-warning text-warning-foreground",
                // Status variants
                scheduled: "border-transparent bg-blue-100 text-blue-700",
                confirmed: "border-transparent bg-green-100 text-green-700",
                seated: "border-transparent bg-amber-100 text-amber-700",
                "in-progress": "border-transparent bg-purple-100 text-purple-700",
                completed: "border-transparent bg-emerald-100 text-emerald-700",
                cancelled: "border-transparent bg-red-100 text-red-700",
                "no-show": "border-transparent bg-gray-100 text-gray-700",
                // Payment variants
                paid: "border-transparent bg-emerald-100 text-emerald-700",
                pending: "border-transparent bg-amber-100 text-amber-700",
                partial: "border-transparent bg-blue-100 text-blue-700",
                draft: "border-transparent bg-gray-100 text-gray-700",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }

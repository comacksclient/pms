"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface RevenueChartProps {
    data: { name: string; value: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    const maxValue = Math.max(...data.map(d => d.value), 100) // Avoid divide by zero

    return (
        <Card className="col-span-full lg:col-span-4">
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full flex items-end justify-between gap-2 pt-4">
                    {data.map((item, i) => {
                        const heightPercentage = Math.round((item.value / maxValue) * 100)
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex items-end justify-center h-full bg-muted/20 rounded-t-sm overflow-hidden">
                                    {/* Bar */}
                                    <div
                                        className="w-full mx-1 bg-primary/90 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-primary"
                                        style={{ height: `${heightPercentage}%` }}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-md transition-opacity whitespace-nowrap border z-10 pointer-events-none">
                                            {formatCurrency(item.value)}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">{item.name}</span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

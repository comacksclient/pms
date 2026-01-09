"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface StatusData {
    name: string
    value: number
    color: string
}

interface AppointmentStatusChartProps {
    data: StatusData[]
}

export function AppointmentStatusChart({ data }: AppointmentStatusChartProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1

    return (
        <Card className="col-span-full lg:col-span-3">
            <CardHeader>
                <CardTitle>Appointment Status</CardTitle>
                <CardDescription>Distribution of all appointments</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item) => (
                        <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-muted-foreground">
                                    {item.value} ({Math.round((item.value / total) * 100)}%)
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                    className={`h-full ${item.color}`}
                                    style={{ width: `${(item.value / total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {data.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            No appointments data available
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

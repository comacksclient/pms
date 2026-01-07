"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                        Manage your clinic preferences and defaults
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clinicName">Clinic Name</Label>
                            <Input id="clinicName" defaultValue="Smile Dental Clinic" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <select
                                id="timezone"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue="Asia/Kolkata"
                            >
                                <option value="Asia/Kolkata">India (IST)</option>
                                <option value="Asia/Dubai">Dubai (GST)</option>
                                <option value="Europe/London">London (GMT)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <select
                                id="currency"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue="INR"
                            >
                                <option value="INR">Indian Rupee (₹)</option>
                                <option value="USD">US Dollar ($)</option>
                                <option value="AED">UAE Dirham (AED)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="appointmentDuration">Default Appointment Duration</Label>
                            <select
                                id="appointmentDuration"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue="30"
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button>Save Changes</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>
                        Set your clinic operating hours
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                            <div key={day} className="flex items-center gap-4">
                                <span className="w-24 font-medium">{day}</span>
                                <Input type="time" defaultValue="09:00" className="w-32" />
                                <span className="text-muted-foreground">to</span>
                                <Input type="time" defaultValue="18:00" className="w-32" />
                            </div>
                        ))}
                        <div className="flex items-center gap-4">
                            <span className="w-24 font-medium text-muted-foreground">Sunday</span>
                            <span className="text-muted-foreground">Closed</span>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button>Save Hours</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

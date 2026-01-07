"use client"

import { useState } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, calculateAge } from "@/lib/utils"

interface Patient {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string | null
    dateOfBirth: Date
    lastVisitDate?: Date | null
    gender?: string | null
}

interface PatientTableProps {
    patients: Patient[]
    onView: (patient: Patient) => void
    onEdit: (patient: Patient) => void
    onDelete: (patient: Patient) => void
}

export function PatientTable({ patients, onView, onEdit, onDelete }: PatientTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState("")

    const columns: ColumnDef<Patient>[] = [
        {
            accessorKey: "name",
            header: "Patient Name",
            accessorFn: (row) => `${row.firstName} ${row.lastName}`,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {row.original.firstName[0]}{row.original.lastName[0]}
                    </div>
                    <div>
                        <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
                        <p className="text-sm text-muted-foreground">{row.original.email || "No email"}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "phone",
            header: "Phone",
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.phone}</span>
            ),
        },
        {
            accessorKey: "age",
            header: "Age",
            accessorFn: (row) => calculateAge(row.dateOfBirth),
            cell: ({ row }) => (
                <span>{calculateAge(row.original.dateOfBirth)} yrs</span>
            ),
        },
        {
            accessorKey: "gender",
            header: "Gender",
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original.gender || "—"}
                </Badge>
            ),
        },
        {
            accessorKey: "lastVisitDate",
            header: "Last Visit",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.lastVisitDate
                        ? format(new Date(row.original.lastVisitDate), "dd MMM yyyy")
                        : "Never"}
                </span>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(row.original)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(row.original)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(row.original)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    const table = useReactTable({
        data: patients,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search by name or phone..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} patients
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <table className="w-full">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b bg-muted/50">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-muted-foreground"
                                >
                                    No patients found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

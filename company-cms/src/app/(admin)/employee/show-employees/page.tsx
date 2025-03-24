"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

// Mock data for employees
const employees = [
  {
    userId: "usr_1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    avatar: "https://ui-avatars.com/api/?name=John+Doe",
    role: "admin",
    isVerified: true,
    createdAt: "2023-01-15T09:30:00Z",
  },
  {
    userId: "usr_2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith",
    role: "senior_employee",
    isVerified: true,
    createdAt: "2023-02-20T14:45:00Z",
  },
  {
    userId: "usr_3",
    firstName: "Robert",
    lastName: "Johnson",
    email: "robert.johnson@example.com",
    avatar: "https://ui-avatars.com/api/?name=Robert+Johnson",
    role: "assigned_employee",
    isVerified: false,
    createdAt: "2023-03-10T11:15:00Z",
  },
  {
    userId: "usr_4",
    firstName: "Emily",
    lastName: "Williams",
    email: "emily.williams@example.com",
    avatar: "https://ui-avatars.com/api/?name=Emily+Williams",
    role: "assigned_employee",
    isVerified: true,
    createdAt: "2023-04-05T16:20:00Z",
  },
  {
    userId: "usr_5",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@example.com",
    avatar: "https://ui-avatars.com/api/?name=Michael+Brown",
    role: "senior_employee",
    isVerified: true,
    createdAt: "2023-05-12T10:00:00Z",
  },
  {
    userId: "usr_6",
    firstName: "Sarah",
    lastName: "Davis",
    email: "sarah.davis@example.com",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Davis",
    role: "assigned_employee",
    isVerified: false,
    createdAt: "2023-06-18T13:30:00Z",
  },
  {
    userId: "usr_7",
    firstName: "David",
    lastName: "Miller",
    email: "david.miller@example.com",
    avatar: "https://ui-avatars.com/api/?name=David+Miller",
    role: "admin",
    isVerified: true,
    createdAt: "2023-07-22T09:45:00Z",
  },
  {
    userId: "usr_8",
    firstName: "Jessica",
    lastName: "Wilson",
    email: "jessica.wilson@example.com",
    avatar: "https://ui-avatars.com/api/?name=Jessica+Wilson",
    role: "assigned_employee",
    isVerified: true,
    createdAt: "2023-08-30T15:10:00Z",
  },
]

// Helper function to format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Role badge styling
function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "success"
    case "senior_employee":
      return "default"
    case "assigned_employee":
      return "secondary"
    default:
      return "destructive"
  }
}

// Format role display name
function formatRoleName(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Column definition type
type Column = {
  id: string
  label: string
  sortable?: boolean
  hidden?: boolean
}

export default function EmployeeTable() {
  // State for table functionality
  const [filteredEmployees, setFilteredEmployees] = useState(employees)
  const [emailFilter, setEmailFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(0)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    email: true,
    role: true,
    isVerified: true,
    createdAt: true,
    actions: true,
  })

  const pageSize = 5

  // Column definitions
  const columns: Column[] = [
    { id: "name", label: "Name", sortable: true },
    { id: "email", label: "Email", sortable: true },
    { id: "role", label: "Role", sortable: true },
    { id: "isVerified", label: "Status", sortable: true },
    { id: "createdAt", label: "Joined", sortable: true },
    { id: "actions", label: "Actions" },
  ]

  // Apply filters and sorting
  useEffect(() => {
    let result = [...employees]

    // Apply email filter
    if (emailFilter) {
      result = result.filter((employee) => employee.email.toLowerCase().includes(emailFilter.toLowerCase()))
    }

    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter((employee) => employee.role === roleFilter)
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue, bValue

        if (sortConfig.key === "name") {
          aValue = `${a.firstName} ${a.lastName}`
          bValue = `${b.firstName} ${b.lastName}`
        } else if (sortConfig.key === "email") {
          aValue = a.email
          bValue = b.email
        } else if (sortConfig.key === "role") {
          aValue = a.role
          bValue = b.role
        } else if (sortConfig.key === "isVerified") {
          aValue = a.isVerified ? "1" : "0"
          bValue = b.isVerified ? "1" : "0"
        } else if (sortConfig.key === "createdAt") {
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
        } else {
          aValue = a[sortConfig.key as keyof typeof a] as string
          bValue = b[sortConfig.key as keyof typeof b] as string
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredEmployees(result)
    setCurrentPage(0) // Reset to first page when filters change
  }, [emailFilter, roleFilter, sortConfig])

  // Handle sorting
  const handleSort = (columnId: string) => {
    setSortConfig((prevSortConfig) => {
      if (prevSortConfig && prevSortConfig.key === columnId) {
        return prevSortConfig.direction === "asc" ? { key: columnId, direction: "desc" } : null
      }
      return { key: columnId, direction: "asc" }
    })
  }

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId as keyof typeof prev],
    }))
  }

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / pageSize)
  const paginatedEmployees = filteredEmployees.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          <div className="flex w-full md:w-auto items-center gap-2">
            <Input
              placeholder="Search by email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="senior_employee">Senior Employee</SelectItem>
                <SelectItem value="assigned_employee">Assigned Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={columnVisibility[column.id as keyof typeof columnVisibility]}
                  onCheckedChange={() => toggleColumnVisibility(column.id)}
                >
                  {column.id === "name"
                    ? "Name"
                    : column.id === "isVerified"
                      ? "Status"
                      : column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) =>
                  columnVisibility[column.id as keyof typeof columnVisibility] ? (
                    <TableHead key={column.id}>
                      {column.sortable ? (
                        <Button variant="ghost" onClick={() => handleSort(column.id)} className="h-8 font-medium">
                          {column.label}
                          {sortConfig?.key === column.id && <ArrowUpDown className="ml-2 h-4 w-4" />}
                        </Button>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  ) : null,
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <TableRow key={employee.userId}>
                    {columnVisibility.name && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                            <AvatarFallback>
                              {employee.firstName.charAt(0)}
                              {employee.lastName ? employee.lastName.charAt(0) : ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{`${employee.firstName} ${employee.lastName}`}</div>
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.email && <TableCell>{employee.email}</TableCell>}
                    {columnVisibility.role && (
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(employee.role)}>{formatRoleName(employee.role)}</Badge>
                      </TableCell>
                    )}
                    {columnVisibility.isVerified && (
                      <TableCell>
                        <Badge variant={employee.isVerified ? "success" : "outline"}>
                          {employee.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                    )}
                    {columnVisibility.createdAt && <TableCell>{formatDate(employee.createdAt)}</TableCell>}
                    {columnVisibility.actions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(employee.userId)}>
                              Copy user ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Edit employee</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete employee</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={Object.values(columnVisibility).filter(Boolean).length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">{filteredEmployees.length} employee(s) total</div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


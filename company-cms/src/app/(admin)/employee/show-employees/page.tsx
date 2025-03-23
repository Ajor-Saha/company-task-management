"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

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
];

// Helper function to format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Role badge styling
function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "success";
    case "senior_employee":
      return "default";
    case "assigned_employee":
      return "secondary";
    default:
      return "destructive";
  }
}

// Format role display name
function formatRoleName(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Define columns for the table
const columns: ColumnDef<(typeof employees)[0]>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.original.avatar} alt={fullName} />
            <AvatarFallback>
              {firstName.charAt(0)}
              {lastName ? lastName.charAt(0) : ""}
            </AvatarFallback>
          </Avatar>
          <div className="font-medium">{fullName}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;

      return (
        <Badge variant={getRoleBadgeVariant(role)}>
          {formatRoleName(role)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },

  {
    accessorKey: "isVerified",
    header: "Status",
    cell: ({ row }) => {
      const isVerified = row.original.isVerified;

      return (
        <Badge variant={isVerified ? "success" : "outline"}>
          {isVerified ? "Verified" : "Pending"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "Actions",
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(employee.userId)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit employee</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function EmployeeTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Apply role filter
  const applyRoleFilter = (value: string) => {
    setRoleFilter(value);
    if (value === "all") {
      table.getColumn("role")?.setFilterValue(undefined);
    } else {
      table.getColumn("role")?.setFilterValue([value]);
    }
  };

  const table = useReactTable({
    data: employees,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          <div className="flex w-full md:w-auto items-center gap-2">
            <Input
              placeholder="Search by email..."
              value={
                (table.getColumn("email")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("email")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Select value={roleFilter} onValueChange={applyRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="senior_employee">Senior Employee</SelectItem>
                <SelectItem value="assigned_employee">
                  Assigned Employee
                </SelectItem>
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
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "name"
                        ? "Name"
                        : column.id === "companyName"
                        ? "Company"
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
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
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} employee(s) total
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

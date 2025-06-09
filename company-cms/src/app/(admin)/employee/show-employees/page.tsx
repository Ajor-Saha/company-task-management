"use client";

import { MoreHorizontal, Loader2,Delete } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { ColorRing } from "react-loader-spinner";

// Types
interface Employee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  avatar?: string;
  salary?: number;
}

interface EmployeeResponse {
  success: boolean;
  message: string;
  data: {
    employees: Employee[];
    total: number;
    pageNumber: number;
    perPage: number;
    totalPages: number;
  };
}

// Helper functions
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

function formatRoleName(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function EmployeeTable() {
  // State for employees data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    perPage: 9,
    total: 0,
    totalPages: 0,
  });

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // New state for edit dialog
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    role: "",
    salary: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Replace the openEditDialog function with this
const openEditDialog = (employee: Employee) => {
  setEmployeeToEdit(employee);
  setEditForm({
    firstName: employee.firstName,
    lastName: employee.lastName,
    role: employee.role,
    salary: employee.salary ?? 0, // Use existing salary or default to 0
  });
  setEditDialogOpen(true);
};

    // New handler for updating employee
  const handleUpdateEmployee = async () => {
    if (!employeeToEdit) return;

    setIsUpdating(true);
    try {
      // Replace with your actual API endpoint for updating employee
      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/employee/update/${employeeToEdit.userId}`,
        {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          role: editForm.role,
          salary: editForm.salary, // Include salary in the payload
        }
      );

      if (response.data.success) {
        toast.success("Employee updated successfully");
        setEditDialogOpen(false);
        fetchEmployees(); // Refresh the employee list
      } else {
        toast.error("Failed to update employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("An error occurred while updating the employee");
    } finally {
      setIsUpdating(false);
    }
  };

    // Replace the handleEditFormChange function with this
const handleEditFormChange = (
  e: React.ChangeEvent<HTMLInputElement> | string,
  field: string
) => {
  if (typeof e === "string") {
    setEditForm((prev) => ({ ...prev, [field]: e }));
  } else {
    const value = field === "salary" ? Number(e.target.value) : e.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }
};

  // Fetch employees with search, filter, and pagination
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      // Add pagination params
      params.append("pageNumber", pagination.pageNumber.toString());
      params.append("perPage", pagination.perPage.toString());

      // Add search and filter if they exist
      if (searchQuery.trim()) {
        params.append("search", searchQuery);
      }

      if (roleFilter && roleFilter !== "all") {
        params.append("filter", roleFilter);
      }

      const response = await Axios.get<EmployeeResponse>(
        `${
          env.BACKEND_BASE_URL
        }/api/employee/get-all-employee?${params.toString()}`
      );

      if (response.data.success) {
        setEmployees(response.data.data.employees);
        setPagination({
          pageNumber: response.data.data.pageNumber,
          perPage: response.data.data.perPage,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
        });
      } else {
        toast.error("Failed to fetch employees data");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("An error occurred while fetching employees");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageNumber, pagination.perPage, searchQuery, roleFilter]);


  // Handle delete employee
  const handleDeleteEmployee = async () => {
    
  };


  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: page,
    }));
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1, // Reset to first page on new search
    }));
  };

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1, // Reset to first page on new filter
    }));
  };

  // Fetch employees on component mount and when search/filter/pagination changes
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchEmployees();
    }, 300);

    return () => clearTimeout(debounceFetch);
  }, [fetchEmployees]);

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];

    // Show max 5 page links
    const maxPages = Math.min(5, pagination.totalPages);
    let startPage = Math.max(1, pagination.pageNumber - 2);
    let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);

    // Adjust startPage if endPage is maxed out
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === pagination.pageNumber}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Card className="m-4">
      <CardContent className="pt-6">
        {/* Search and Role Filter UI */}
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          <div className="flex w-full md:w-auto items-center gap-2">
            <Input
              placeholder="Search by name..."
              className="max-w-sm"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
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
        </div>

        {/* Employee Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <ColorRing
                        visible={true}
                        height="80"
                        width="80"
                        colors={[
                          "#e15b64",
                          "#f47e60",
                          "#f8b26a",
                          "#abbd81",
                          "#849b87",
                        ]}
                        ariaLabel="color-ring-loading"
                        wrapperStyle={{}}
                        wrapperClass="color-ring-wrapper"
                      />
                      Please wait...
                    </div>
                  </TableCell>
                </TableRow>
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={employee.avatar}
                            alt={`${employee.firstName} ${employee.lastName}`}
                          />
                          <AvatarFallback>
                            {employee.firstName.charAt(0)}
                            {employee.lastName
                              ? employee.lastName.charAt(0)
                              : ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{`${employee.firstName} ${employee.lastName}`}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(employee.role)}>
                        {formatRoleName(employee.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.isVerified ? "success" : "outline"}
                      >
                        {employee.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(employee.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard.writeText(employee.userId)
                            }
                          >
                            Copy user ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const employeeName = `${employee.firstName.toLowerCase()}-${employee.lastName.toLowerCase()}`;
                              window.location.href = `/employee/${employeeName}?employeeId=${employee.userId}`;
                            }}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                            Edit employee
                          </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                             setEmployeeToDelete(employee);
                              setDeleteDialogOpen(true);
                          }}
                        >
                          <span>Delete</span>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Employee Dialog */}
        <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <AlertDialogContent className="bg-white dark:bg-black text-black dark:text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-black dark:text-white">
                Edit Employee
              </AlertDialogTitle>
              <AlertDialogDescription className="text-black dark:text-white">
                Update the details for{" "}
                <strong>{`${employeeToEdit?.firstName} ${employeeToEdit?.lastName}`}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-black dark:text-white">
                  First Name
                </label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) => handleEditFormChange(e, "firstName")}
                  placeholder="Enter first name"
                  className="text-black dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">
                  Last Name
                </label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) => handleEditFormChange(e, "lastName")}
                  placeholder="Enter last name"
                  className="text-black dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black dark:text-white">
                  Role
                </label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => handleEditFormChange(value, "role")}
                >
                  <SelectTrigger className="w-full text-black dark:text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="senior_employee">Senior Employee</SelectItem>
                    <SelectItem value="assigned_employee">Assigned Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                    <div>
        <label className="text-sm font-medium text-black dark:text-white">
          Salary
        </label>
        <Input
          type="number"
          value={editForm.salary}
          onChange={(e) => handleEditFormChange(e, "salary")}
          placeholder="Enter salary"
          className="text-black dark:text-white"
          min="0"
        />
      </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleUpdateEmployee}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

         {/* Delete Confirmation Dialog */}
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent className="bg-white dark:bg-black text-black dark:text-white">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-black dark:text-white">Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription className="text-black dark:text-white">
        This action cannot be undone. This will permanently delete the
        employee{" "}
        <strong className="text-red-600">{`${employeeToDelete?.firstName} ${employeeToDelete?.lastName}`}</strong>.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteEmployee}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

        {/* Footer with Pagination */}
        <div className="flex justify-between items-center space-x-2 py-6">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{employees.length}</span> of{" "}
            <span className="font-medium">{pagination.total}</span> employees
          </div>

          {pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.pageNumber > 1) {
                        handlePageChange(pagination.pageNumber - 1);
                      }
                    }}
                    className={
                      pagination.pageNumber <= 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>

                {renderPaginationItems()}

                {pagination.totalPages > 5 &&
                  pagination.pageNumber + 2 < pagination.totalPages && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.pageNumber < pagination.totalPages) {
                        handlePageChange(pagination.pageNumber + 1);
                      }
                    }}
                    className={
                      pagination.pageNumber >= pagination.totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



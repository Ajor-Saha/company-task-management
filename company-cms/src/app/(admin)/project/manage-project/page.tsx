"use client"

import { useCallback, useEffect, useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Users, UserPlus, X, EyeClosedIcon, EyeOffIcon, EyeIcon } from "lucide-react"
import { format } from "date-fns"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import axios from "axios"

interface Employee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  avatar?: string;
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


interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  assignedEmployees?: Employee[];
  totalTasks?: number;
}

export default function ProjectTable() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const openAssignDialog = (project: Project) => {
    setSelectedProject(project)
    setDialogOpen(true)
    setStatusMessage(null)
  }

  const assignEmployeeToProject = async (employee: Employee) => {
    if (!selectedProject) return;

    try {
      // Make API call to assign employee to project
      const response = await Axios.post(`${env.BACKEND_BASE_URL}/api/project/assign-employee`, {
        projectId: selectedProject.id,
        employeeId: employee.userId
      });

      if (response.data?.success) {
        setStatusMessage({
          text: `${employee.firstName} ${employee.lastName} has been assigned to ${selectedProject.name}.`,
          type: "success",
        });
        
        // Refresh project data after successful assignment
        fetchProjects();
      } else {
        setStatusMessage({
          text: response.data?.message || "Failed to assign employee.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error assigning employee:", error);
      setStatusMessage({
        text: "Failed to assign employee to project.",
        type: "error",
      });
    }

    setDialogOpen(false);
  }

  // Filter out employees already assigned to the selected project
  const getAvailableEmployees = () => {
    if (!selectedProject || !selectedProject.assignedEmployees) return allEmployees;

    const assignedIds = selectedProject.assignedEmployees.map((emp) => emp.userId);
    return allEmployees.filter((emp) => !assignedIds.includes(emp.userId));
  }

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/project/get-admin-projects`);
      if (response.data?.success) {
        setAllProjects(response.data.data);
      } else {
        console.error("API Error Message:", response.data.message);
      }
    } catch (error) {
      console.error("FetchProjects Error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/employee/get-all-employee`);
      if (response.data?.success) {
        setAllEmployees(response.data.data.employees);
      } else {
        console.error("API Error Message:", response.data.message);
      }
    } catch (error) {
      console.error("FetchEmployees Error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", error.response?.data);
      }
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, [fetchProjects, fetchEmployees]);

  
 
  

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Project Management</h1>
        <p className="text-muted-foreground mt-1">Manage your projects and team assignments</p>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-md flex items-center justify-between ${
            statusMessage.type === "success" ? "bg-green-100 text-green-800 dark:bg-slate-900" : "bg-red-100 text-red-800"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-2 p-1 rounded-full hover:bg-black/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableCaption>List of current projects</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead className="hidden md:table-cell text-center">Total Tasks</TableHead>
              <TableHead className="text-center">Assigned</TableHead>
              <TableHead className="hidden md:table-cell text-center">Created</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Deadline</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="hidden md:table-cell text-center">10</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="whitespace-nowrap">
                    5 employees
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {format(project.createdAt, "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {format(project.updatedAt, "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openAssignDialog(project)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Assign Employee</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {}}>
                        <EyeIcon className="mr-2 h-4 w-4" />
                        <span>View Project Details</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog for assigning employees */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedProject && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Assign Employee to {selectedProject.name}</DialogTitle>
              <DialogDescription>Select an employee to assign to this project.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="h-[300px] overflow-y-auto pr-1">
                {getAvailableEmployees().length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAvailableEmployees().map((employee) => (
                        <TableRow key={employee.userId}>
                          <TableCell className="font-medium">{employee.firstName} {employee.lastName}</TableCell>
                          <TableCell>{employee.role}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => assignEmployeeToProject(employee)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-8 w-8 mb-2" />
                    <p>All employees are already assigned to this project.</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}


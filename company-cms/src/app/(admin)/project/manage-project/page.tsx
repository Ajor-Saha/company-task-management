"use client"

import { useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Users, UserPlus, X, EyeClosedIcon, EyeOffIcon, EyeIcon } from "lucide-react"
import { format } from "date-fns"

// Mock data for all available employees
const allEmployees = [
  { id: 1, name: "John Doe", role: "UI Designer" },
  { id: 2, name: "Jane Smith", role: "Frontend Developer" },
  { id: 3, name: "Mike Johnson", role: "Backend Developer" },
  { id: 4, name: "Sarah Williams", role: "Project Manager" },
  { id: 5, name: "Alex Brown", role: "QA Tester" },
  { id: 6, name: "David Clark", role: "Mobile Developer" },
  { id: 7, name: "Emily Davis", role: "UI/UX Designer" },
  { id: 8, name: "Robert Wilson", role: "Systems Analyst" },
  { id: 9, name: "Lisa Thompson", role: "Database Administrator" },
  { id: 10, name: "Kevin Martin", role: "Data Analyst" },
  { id: 11, name: "Thomas Anderson", role: "Security Specialist" },
  { id: 12, name: "Jennifer Lee", role: "Network Administrator" },
  { id: 13, name: "Paul Roberts", role: "Compliance Officer" },
  { id: 14, name: "Maria Garcia", role: "Content Strategist" },
  { id: 15, name: "James Wilson", role: "DevOps Engineer" },
]

// Mock data for projects
const initialProjects = [
  {
    id: 1,
    name: "Website Redesign",
    totalTasks: 24,
    totalAssignedEmployees: 5,
    createdAt: new Date("2023-01-15"),
    finalAt: new Date("2023-04-30"),
    assignedEmployees: [
      { id: 1, name: "John Doe", role: "UI Designer" },
      { id: 2, name: "Jane Smith", role: "Frontend Developer" },
      { id: 3, name: "Mike Johnson", role: "Backend Developer" },
      { id: 4, name: "Sarah Williams", role: "Project Manager" },
      { id: 5, name: "Alex Brown", role: "QA Tester" },
    ],
    details: {
      description: "Complete redesign of company website with new branding",
      progress: "75%",
      status: "In Progress",
      priority: "High",
    },
  },
  {
    id: 2,
    name: "Mobile App Development",
    totalTasks: 36,
    totalAssignedEmployees: 4,
    createdAt: new Date("2023-02-10"),
    finalAt: new Date("2023-06-15"),
    assignedEmployees: [
      { id: 2, name: "Jane Smith", role: "Frontend Developer" },
      { id: 3, name: "Mike Johnson", role: "Backend Developer" },
      { id: 6, name: "David Clark", role: "Mobile Developer" },
      { id: 7, name: "Emily Davis", role: "UI/UX Designer" },
    ],
    details: {
      description: "Develop a cross-platform mobile application",
      progress: "50%",
      status: "In Progress",
      priority: "Medium",
    },
  },
  {
    id: 3,
    name: "CRM Integration",
    totalTasks: 18,
    totalAssignedEmployees: 3,
    createdAt: new Date("2023-03-05"),
    finalAt: new Date("2023-05-20"),
    assignedEmployees: [
      { id: 3, name: "Mike Johnson", role: "Backend Developer" },
      { id: 8, name: "Robert Wilson", role: "Systems Analyst" },
      { id: 9, name: "Lisa Thompson", role: "Database Administrator" },
    ],
    details: {
      description: "Integrate new CRM system with existing infrastructure",
      progress: "30%",
      status: "In Progress",
      priority: "High",
    },
  },
  {
    id: 4,
    name: "Data Migration",
    totalTasks: 12,
    totalAssignedEmployees: 2,
    createdAt: new Date("2023-04-01"),
    finalAt: new Date("2023-05-15"),
    assignedEmployees: [
      { id: 9, name: "Lisa Thompson", role: "Database Administrator" },
      { id: 10, name: "Kevin Martin", role: "Data Analyst" },
    ],
    details: {
      description: "Migrate data from legacy systems to new platform",
      progress: "90%",
      status: "Almost Complete",
      priority: "Medium",
    },
  },
  {
    id: 5,
    name: "Security Audit",
    totalTasks: 8,
    totalAssignedEmployees: 3,
    createdAt: new Date("2023-04-15"),
    finalAt: new Date("2023-05-30"),
    assignedEmployees: [
      { id: 11, name: "Thomas Anderson", role: "Security Specialist" },
      { id: 12, name: "Jennifer Lee", role: "Network Administrator" },
      { id: 13, name: "Paul Roberts", role: "Compliance Officer" },
    ],
    details: {
      description: "Conduct comprehensive security audit of all systems",
      progress: "20%",
      status: "Just Started",
      priority: "Critical",
    },
  },
]

export default function ProjectTable() {
  const [projects, setProjects] = useState(initialProjects)
  const [selectedProject, setSelectedProject] = useState<(typeof projects)[number] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const openAssignDialog = (project: (typeof projects)[number]) => {
    setSelectedProject(project)
    setDialogOpen(true)
    setStatusMessage(null)
  }

  const assignEmployeeToProject = (employee: (typeof allEmployees)[number]) => {
    if (!selectedProject) return

    // Check if employee is already assigned to this project
    const isAlreadyAssigned = selectedProject.assignedEmployees.some((emp) => emp.id === employee.id)

    if (isAlreadyAssigned) {
      setStatusMessage({
        text: `${employee.name} is already assigned to this project.`,
        type: "error",
      })
      return
    }

    // Update the projects state with the new employee
    setProjects(
      projects.map((project) => {
        if (project.id === selectedProject.id) {
          const updatedEmployees = [...project.assignedEmployees, employee]
          return {
            ...project,
            assignedEmployees: updatedEmployees,
            totalAssignedEmployees: updatedEmployees.length,
          }
        }
        return project
      }),
    )

    // Close the dialog
    setDialogOpen(false)

    // Set success message
    setStatusMessage({
      text: `${employee.name} has been assigned to ${selectedProject.name}.`,
      type: "success",
    })
  }

  // Filter out employees already assigned to the selected project
  const getAvailableEmployees = () => {
    if (!selectedProject) return []

    const assignedIds = selectedProject.assignedEmployees.map((emp) => emp.id)
    return allEmployees.filter((emp) => !assignedIds.includes(emp.id))
  }

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
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="hidden md:table-cell text-center">{project.totalTasks}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="whitespace-nowrap">
                    {project.totalAssignedEmployees} employees
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {format(project.createdAt, "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {format(project.finalAt, "MMM dd, yyyy")}
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
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
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


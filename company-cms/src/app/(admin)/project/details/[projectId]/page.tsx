"use client"

import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, DollarSign, Loader2, Workflow, CheckCircle2, Clock, Pause, Eye, ListTodo, Search, SortAsc, SortDesc, Filter, User, Users, Plus, Edit, Save, X, AlertCircle, Target, BarChart3 } from 'lucide-react'
import Link from "next/link"
import { Triangle } from "react-loader-spinner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Define the type for the RichTextEditor ref
type RichTextEditorHandle = {
  getContent: () => string
}

interface ProjectDetails {
  id: string
  name: string
  description: string
  budget: number
  status: "to-do" | "in-progress" | "review" | "completed" | "hold"
  companyId: string
  startDate: string
  endDate: string
}

interface TaskMetrics {
  total: number
  "to-do": number
  "in-progress": number
  review: number
  completed: number
  hold: number
  completionPercentage: number
}

interface Task {
  id: string
  name: string
  description?: string
  status: "to-do" | "in-progress" | "review" | "completed" | "hold"
  assignedUser: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  dueDate: string
  createdAt: string
  priority: "low" | "medium" | "high"
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  joinedAt: string
}

interface ProjectNote {
  id: string
  content: string
  createdAt: string
  createdBy: {
    id: string
    name: string
    avatar?: string
  }
}

type SortField = "name" | "dueDate" | "status" | "priority"
type SortOrder = "asc" | "desc"

const statusOptions = [
  { value: "to-do", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "completed", label: "Completed" },
  { value: "hold", label: "On Hold" },
]

const statusConfig = {
  "to-do": {
    label: "To Do",
    icon: ListTodo,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  review: {
    label: "In Review",
    icon: Eye,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  hold: {
    label: "On Hold",
    icon: Pause,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Project Notes Component

// Enhanced Task List Component (keeping the existing one but with minor improvements)
const EnhancedTaskList = ({ projectId }: { projectId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("dueDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const priorityConfig = {
    low: { label: "Low", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    medium: { label: "Medium", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
    high: { label: "High", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  }

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true)
      try {
        // Mock data for demonstration
        const mockTasks: Task[] = [
          {
            id: "1",
            name: "Design user interface mockups",
            description: "Create wireframes and mockups for the main dashboard",
            status: "in-progress",
            assignedUser: {
              id: "user1",
              name: "Alice Johnson",
              email: "alice@example.com",
              avatar: "/placeholder.svg?height=32&width=32",
            },
            dueDate: "2024-02-15",
            createdAt: "2024-01-10",
            priority: "high",
          },
          {
            id: "2",
            name: "Implement authentication system",
            description: "Set up user login and registration functionality",
            status: "to-do",
            assignedUser: {
              id: "user2",
              name: "Bob Smith",
              email: "bob@example.com",
              avatar: "/placeholder.svg?height=32&width=32",
            },
            dueDate: "2024-02-20",
            createdAt: "2024-01-12",
            priority: "high",
          },
          {
            id: "3",
            name: "Write API documentation",
            description: "Document all API endpoints and their usage",
            status: "review",
            assignedUser: {
              id: "user3",
              name: "Carol Davis",
              email: "carol@example.com",
              avatar: "/placeholder.svg?height=32&width=32",
            },
            dueDate: "2024-02-10",
            createdAt: "2024-01-08",
            priority: "medium",
          },
          {
            id: "4",
            name: "Set up CI/CD pipeline",
            description: "Configure automated testing and deployment",
            status: "completed",
            assignedUser: {
              id: "user4",
              name: "David Wilson",
              email: "david@example.com",
              avatar: "/placeholder.svg?height=32&width=32",
            },
            dueDate: "2024-02-05",
            createdAt: "2024-01-05",
            priority: "medium",
          },
          {
            id: "5",
            name: "Database optimization",
            description: "Optimize database queries for better performance",
            status: "hold",
            assignedUser: {
              id: "user1",
              name: "Alice Johnson",
              email: "alice@example.com",
              avatar: "/placeholder.svg?height=32&width=32",
            },
            dueDate: "2024-02-25",
            createdAt: "2024-01-15",
            priority: "low",
          },
        ]
        setTasks(mockTasks)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        toast.error("Failed to fetch tasks")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [projectId])

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = tasks.map((task) => task.assignedUser)
    const uniqueUsersMap = new Map()
    users.forEach((user) => {
      if (!uniqueUsersMap.has(user.id)) {
        uniqueUsersMap.set(user.id, user)
      }
    })
    return Array.from(uniqueUsersMap.values())
  }, [tasks])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesUser = userFilter === "all" || task.assignedUser.id === userFilter

      return matchesSearch && matchesStatus && matchesUser
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "dueDate":
          aValue = new Date(a.dueDate).getTime()
          bValue = new Date(b.dueDate).getTime()
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "priority":
          const priorityOrder = { low: 1, medium: 2, high: 3 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [tasks, searchTerm, statusFilter, userFilter, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const formatTaskDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays === 1) {
      return "Due tomorrow"
    } else {
      return `Due in ${diffDays} days`
    }
  }

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading tasks...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Task Management</span>
          <Badge variant="outline">{filteredAndSortedTasks.length} tasks</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[180px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-medium">
                    Task Name
                    {sortField === "name" &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-medium">
                    Status
                    {sortField === "status" &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead>Assigned User</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("dueDate")} className="h-auto p-0 font-medium">
                    Due Date
                    {sortField === "dueDate" &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("priority")} className="h-auto p-0 font-medium">
                    Priority
                    {sortField === "priority" &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No tasks found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTasks.map((task) => {
                  const StatusIcon = statusConfig[task.status].icon
                  const isTaskOverdue = isOverdue(task.dueDate) && task.status !== "completed"

                  return (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.name}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[task.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={task.assignedUser.avatar || "/placeholder.svg"}
                              alt={task.assignedUser.name}
                            />
                            <AvatarFallback>
                              {task.assignedUser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{task.assignedUser.name}</div>
                            <div className="text-xs text-muted-foreground">{task.assignedUser.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className={`text-sm ${isTaskOverdue ? "text-red-600 font-medium" : ""}`}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className={`text-xs ${isTaskOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                              {formatTaskDate(task.dueDate)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityConfig[task.priority].color}>
                          {priorityConfig[task.priority].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

const DatePicker = ({
  selectedDate,
  setSelectedDate,
  onChange,
  isLoading,
}: {
  selectedDate?: Date
  setSelectedDate: (date: Date | undefined) => void
  onChange?: (date: Date) => void
  isLoading?: boolean
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          disabled={isLoading}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date)
            if (date && onChange) {
              onChange(date)
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// Main Project Details Component
const ProjectDetails = () => {
  const { projectId } = useParams()
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [isUpdatingDates, setIsUpdatingDates] = useState(false)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const editorRef = useRef<RichTextEditorHandle>(null)

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/project/get-project-details/${projectId}`)

      if (response.data.success) {
        const proj: ProjectDetails = response.data.data
        setProject(proj)
        setStartDate(new Date(proj.startDate))
        setEndDate(new Date(proj.endDate))
        setTempBudget(proj.budget.toString())
      } else {
        setError(response.data.message || "Failed to fetch project details")
        toast.error(response.data.message || "Failed to fetch project details")
      }
    } catch (err) {
      console.error("Error fetching project details:", err)
      setError("An error occurred while fetching project details")
      toast.error("An error occurred while fetching project details")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const fetchTaskMetrics = useCallback(async () => {
    if (!projectId) return

    setIsLoadingMetrics(true)
    try {
      // This would be your actual API endpoint for task metrics
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/project/task-metrics/${projectId}`)

      if (response.data.success) {
        setTaskMetrics(response.data.data)
      } else {
        // Fallback with mock data if API doesn't exist yet
        const mockMetrics: TaskMetrics = {
          total: 24,
          "to-do": 8,
          "in-progress": 6,
          review: 3,
          completed: 5,
          hold: 2,
          completionPercentage: 20.8,
        }
        setTaskMetrics(mockMetrics)
      }
    } catch (err) {
      console.error("Error fetching task metrics:", err)
      // Fallback with mock data
      const mockMetrics: TaskMetrics = {
        total: 24,
        "to-do": 8,
        "in-progress": 6,
        review: 3,
        completed: 5,
        hold: 2,
        completionPercentage: 20.8,
      }
      setTaskMetrics(mockMetrics)
    } finally {
      setIsLoadingMetrics(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProjectDetails()
    fetchTaskMetrics()
  }, [fetchProjectDetails, fetchTaskMetrics])

  const updateProjectStatus = async (newStatus: string) => {
    if (!project || isUpdatingStatus) return

    setIsUpdatingStatus(true)
    try {
      const response = await Axios.patch(`${env.BACKEND_BASE_URL}/api/project/update-project-status/${project.id}`, {
        status: newStatus,
      })

      if (response.data.success) {
        setProject({
          ...project,
          status: newStatus as ProjectDetails["status"],
        })
        toast.success("Project status updated successfully")
      } else {
        toast.error(response.data.message || "Failed to update project status")
      }
    } catch (err) {
      console.error("Error updating project status:", err)
      toast.error("An error occurred while updating project status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const updateProjectDescription = async () => {
    if (!project) return

    setIsSavingDescription(true)
    const rawDescription = editorRef.current?.getContent() || ""
    const description = rawDescription === "<p><br></p>" || rawDescription.trim() === "" ? "" : rawDescription

    try {
      const response = await Axios.put(`${env.BACKEND_BASE_URL}/api/project/update-project-description/${project.id}`, {
        description,
      })

      if (response.data.success) {
        setProject({ ...project, description })
        toast.success("Project description updated successfully")
      } else {
        toast.error(response.data.message || "Failed to update project description")
      }
    } catch (err) {
      console.error("Error updating project description:", err)
      toast.error("An error occurred while updating project description")
    } finally {
      setIsSavingDescription(false)
    }
  }

  const updateProjectDates = async (newStartDate?: Date, newEndDate?: Date) => {
    if (!project || isUpdatingDates) return

    setIsUpdatingDates(true)
    try {
      const payload: { startDate?: string; endDate?: string } = {}
      if (newStartDate) {
        payload.startDate = newStartDate.toISOString().split("T")[0]
      }
      if (newEndDate) {
        payload.endDate = newEndDate.toISOString().split("T")[0]
      }

      const response = await Axios.put(`${env.BACKEND_BASE_URL}/api/project/update-project/${project.id}`, payload)

      if (response.data.success) {
        const updatedProject = {
          ...project,
          ...(newStartDate && { startDate: payload.startDate! }),
          ...(newEndDate && { endDate: payload.endDate! }),
        }
        setProject(updatedProject)
        if (newStartDate) setStartDate(newStartDate)
        if (newEndDate) setEndDate(newEndDate)
        toast.success("Project dates updated successfully")
      } else {
        toast.error(response.data.message || "Failed to update project dates")
      }
    } catch (err) {
      console.error("Error updating project dates:", err)
      toast.error("An error occurred while updating project dates")
    } finally {
      setIsUpdatingDates(false)
    }
  }

  const updateProjectBudget = async () => {
    if (!project) return

    const newBudget = Number.parseFloat(tempBudget)
    if (isNaN(newBudget) || newBudget < 0) {
      toast.error("Please enter a valid budget amount")
      return
    }

    try {
      const response = await Axios.put(`${env.BACKEND_BASE_URL}/api/project/update-project/${project.id}`, {
        budget: newBudget,
      })

      if (response.data.success) {
        setProject({ ...project, budget: newBudget })
        setIsEditingBudget(false)
        toast.success("Project budget updated successfully")
      } else {
        toast.error(response.data.message || "Failed to update project budget")
      }
    } catch (err) {
      console.error("Error updating project budget:", err)
      toast.error("An error occurred while updating project budget")
    }
  }

  const updateStartDate = (newDate: Date) => {
    updateProjectDates(newDate, undefined)
  }

  const updateEndDate = (newDate: Date) => {
    updateProjectDates(undefined, newDate)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Triangle
          visible={true}
          height="80"
          width="80"
          color="#4fa94d"
          ariaLabel="triangle-loading"
          wrapperStyle={{}}
          wrapperClass=""
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link href="/project/all-project">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">Project not found</p>
        <Button asChild>
          <Link href="/project/all-project">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/project/all-project">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
            </div>
            <Select value={project.status} onValueChange={updateProjectStatus} disabled={isUpdatingStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  {isUpdatingStatus ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded-full text-sm">
                      {statusOptions.find((opt) => opt.value === project.status)?.label || "Select Status"}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Project Status</SelectLabel>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="px-2 py-1 rounded-full">{status.label}</div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-primary mr-2" />
                    <p className="text-sm font-medium text-primary">Budget</p>
                  </div>
                  {!isEditingBudget && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingBudget(true)} className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="pl-7">
                  {isEditingBudget ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempBudget}
                        onChange={(e) => setTempBudget(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Enter budget"
                      />
                      <Button size="sm" onClick={updateProjectBudget} className="h-8 px-2">
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingBudget(false)
                          setTempBudget(project.budget.toString())
                        }}
                        className="h-8 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium text-lg">{formatCurrency(project.budget)}</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center mb-3 gap-2">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <p className="text-sm font-medium text-primary">Start Date</p>
                </div>
                <DatePicker
                  selectedDate={startDate}
                  setSelectedDate={setStartDate}
                  onChange={updateStartDate}
                  isLoading={isUpdatingDates}
                />
              </div>

              <div className="p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center mb-3 gap-2">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <p className="text-sm font-medium text-primary">End Date</p>
                </div>
                <DatePicker
                  selectedDate={endDate}
                  setSelectedDate={setEndDate}
                  onChange={updateEndDate}
                  isLoading={isUpdatingDates}
                />
              </div>
            </div>

            <Separator />

            {/* Project Progress Metrics Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Project Progress Analytics
              </h3>

              {isLoadingMetrics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading metrics...</span>
                </div>
              ) : taskMetrics ? (
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Overall Progress
                      </CardTitle>
                      <CardDescription>
                        {taskMetrics.completed} of {taskMetrics.total} tasks completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Completion Rate</span>
                          <span className="font-medium">{taskMetrics.completionPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={taskMetrics.completionPercentage} className="h-3" />
                        {taskMetrics.completionPercentage < 15 && (
                          <div className="flex items-center gap-2 text-sm text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Project is in early stages</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Task Status Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(statusConfig).map(([status, config]) => {
                      const Icon = config.icon
                      const count = taskMetrics[status as keyof TaskMetrics] as number
                      const percentage = taskMetrics.total > 0 ? ((count / taskMetrics.total) * 100).toFixed(1) : "0"

                      return (
                        <Card key={status} className="relative overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="secondary" className={config.color}>
                                {percentage}%
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-2xl font-bold">{count}</p>
                              <p className="text-xs text-muted-foreground">{config.label}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{taskMetrics.total}</div>
                        <p className="text-sm text-muted-foreground">Total Tasks</p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{taskMetrics["in-progress"]}</div>
                        <p className="text-sm text-muted-foreground">Active Tasks</p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{taskMetrics.completed}</div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No task metrics available</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-3">Description</h3>
              <div className="space-y-4">
                <RichTextEditor ref={editorRef} initialContent={project.description} />
                <Button
                  onClick={updateProjectDescription}
                  variant="outline"
                  className="mt-4"
                  disabled={isSavingDescription}
                >
                  {isSavingDescription ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <span className="text-blue-400 dark:text-blue-300">Save</span>
                  )}
                </Button>
              </div>
            </div>

            <Separator />
            <div>
              <EnhancedTaskList projectId={project.id} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectDetails

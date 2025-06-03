import { useState, useEffect, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Search, SortAsc, SortDesc, Filter, User, ListTodo, Clock, Eye, CheckCircle2, Pause } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  name: string
  description?: string
  status: "to-do" | "in-progress" | "review" | "completed" | "hold"
  assignedTo: {
    userId: string
    firstName: string
    lastName: string
    avatar?: string
  }
  endDate: string
  createdAt: string
  updatedAt: string
}

type SortField = "name" | "dueDate" | "status"
type SortOrder = "asc" | "desc"

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

const EnhancedTaskList = ({ projectId }: { projectId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("dueDate")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Implement useCallback for fetching tasks
  const fetchTasks = useCallback(async () => {
    if (!projectId) return
    
    setIsLoading(true)
    try {
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/task/get-project-tasks/${projectId}`)
      if (response.data?.success) {
        setTasks(response.data.data)
      } else {
        toast.error(response.data?.message || "Failed to fetch tasks")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error(error instanceof Error ? error.message : "Failed to fetch tasks")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // Trigger fetch when component mounts or projectId changes
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = tasks.map((task) => ({
      id: task.assignedTo.userId,
      name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
      avatar: task.assignedTo.avatar
    }))
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
      const matchesUser = userFilter === "all" || task.assignedTo.userId === userFilter

      return matchesSearch && matchesStatus && matchesUser
    })      // Sort tasks
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "dueDate":
          aValue = new Date(a.endDate).getTime()
          bValue = new Date(b.endDate).getTime()
          break
        case "status":
          aValue = a.status
          bValue = b.status
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


  const isOverdue = (dateString: string, status: string) => {
    if (status === "completed") return false
    const dueDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today
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
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
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

                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No tasks found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTasks.map((task) => {
                    const StatusIcon = statusConfig[task.status].icon
                    const isTaskOverdue = isOverdue(task.endDate, task.status)

                    return (
                      <TableRow key={task.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.name}</div>
                            
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
                                src={task.assignedTo.avatar || "/placeholder.svg"}
                                alt={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                              />
                              <AvatarFallback>
                                {task.assignedTo.firstName[0]}
                                {task.assignedTo.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                              </div>
                              <div className="text-xs text-muted-foreground">Assigned</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">
                                {new Date(task.endDate).toLocaleDateString()}
                              </div>
                              
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EnhancedTaskList
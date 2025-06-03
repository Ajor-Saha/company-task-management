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
import { Input } from "@/components/ui/input"
import EnhancedTaskList from "@/app/(admin)/project/_components/EnhancedTaskList"

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
  todo: number
  inProgress: number
  review: number
  completed: number
  hold: number
  completionRate: number
  overDueTasks: number
}



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
    key: "todo"
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    key: "inProgress"
  },
  review: {
    label: "In Review",
    icon: Eye,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    key: "review"
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    key: "completed"
  },
  hold: {
    label: "On Hold",
    icon: Pause,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    key: "hold"
  },
}


function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
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
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/project/get-project-stats/${projectId}`)

      if (response.data.success) {
        const taskData = response.data.data.tasks
        setTaskMetrics({
          total: taskData.total,
          todo: taskData.todo,
          inProgress: taskData.inProgress,
          review: taskData.review,
          completed: taskData.completed,
          hold: taskData.hold,
          completionRate: taskData.completionRate,
          overDueTasks: taskData.overDueTasks
        })
      } else {
        toast.error(response.data.message || "Failed to fetch task metrics")
      }
    } catch (err) {
      console.error("Error fetching task metrics:", err)
      toast.error("An error occurred while fetching task metrics")
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
                          <span className="font-medium">{taskMetrics.completionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={taskMetrics.completionRate} className="h-3" />
                        {taskMetrics.completionRate < 15 && (
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
                      const metricCount = taskMetrics[config.key as keyof TaskMetrics] as number
                      const percentage = taskMetrics.total > 0 ? ((metricCount / taskMetrics.total) * 100).toFixed(1) : "0"

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
                              <p className="text-2xl font-bold">{metricCount}</p>
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
                        <div className="text-2xl font-bold text-blue-600">{taskMetrics.inProgress}</div>
                        <p className="text-sm text-muted-foreground">Active Tasks</p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{taskMetrics.overDueTasks}</div>
                        <p className="text-sm text-muted-foreground">Overdue Tasks</p>
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

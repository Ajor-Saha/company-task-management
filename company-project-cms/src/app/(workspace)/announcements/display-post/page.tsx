"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Tag,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { announcementAPI } from "@/lib/api"
import type { Announcement } from "@/types/announcement"

interface AnnouncementsDisplayProps {
  onToggleStatus?: (id: string) => void
  onDeleteAnnouncement?: (id: string) => void
}

export default function AnnouncementsDisplay({ onToggleStatus, onDeleteAnnouncement }: AnnouncementsDisplayProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "unknown">("unknown")
  const { toast } = useToast()

  // Load announcements on component mount
  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await announcementAPI.fetchAnnouncements()
      if (response.success && response.data) {
        setAnnouncements(response.data)
        setApiStatus("online")
      } else {
        setApiStatus("offline")
        if (!showRefreshIndicator) {
          toast({
            title: "Using Offline Mode",
            description: "API unavailable, showing mock data",
          })
        }
      }
    } catch (error) {
      setApiStatus("offline")
      console.error("Failed to load announcements:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const announcement = announcements.find((a) => a.id === id)
    if (!announcement) return

    try {
      const response = await announcementAPI.updateAnnouncementStatus(id, !announcement.isActive)
      if (response.success) {
        setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)))
        toast({
          title: "Status Updated",
          description: `Announcement ${!announcement.isActive ? "activated" : "deactivated"} successfully.`,
        })
        if (onToggleStatus) onToggleStatus(id)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update announcement status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update announcement:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const response = await announcementAPI.deleteAnnouncement(id)
      if (response.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        toast({
          title: "Announcement Deleted",
          description: "The announcement has been removed successfully.",
        })
        if (onDeleteAnnouncement) onDeleteAnnouncement(id)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete announcement",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "low":
        return <CheckCircle className="h-4 w-4" />
      case "medium":
        return <Info className="h-4 w-4" />
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "urgent":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.author.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriority = filterPriority === "all" || announcement.priority === filterPriority
    const matchesCategory = filterCategory === "all" || announcement.category === filterCategory

    return matchesSearch && matchesPriority && matchesCategory
  })

  const categories = [...new Set(announcements.map((a) => a.category))]

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Loading announcements...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">Stay updated with the latest news and information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnnouncements(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant="secondary" className="text-sm">
            {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterPriority !== "all" || filterCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "No announcements have been created yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`transition-all hover:shadow-md ${!announcement.isActive ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {getPriorityIcon(announcement.priority)}
                        <span className="ml-1 capitalize">{announcement.priority}</span>
                      </Badge>
                      <Badge variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {announcement.category}
                      </Badge>
                      {!announcement.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <h3 className="text-xl font-semibold leading-tight mb-2 break-words">{announcement.title}</h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleToggleStatus(announcement.id)}>
                      {announcement.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{announcement.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

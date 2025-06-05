"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Send, User, Tag, AlertCircle } from "lucide-react"
import type { CreateAnnouncementData } from "@/types/announcement"

interface CreateAnnouncementProps {
  onSubmit: (data: CreateAnnouncementData) => Promise<void>
  isLoading?: boolean
}

export default function CreateAnnouncement({ onSubmit, isLoading = false }: CreateAnnouncementProps) {
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: "",
    content: "",
    priority: "medium",
    category: "",
    author: "",
  })

  const [errors, setErrors] = useState<Partial<CreateAnnouncementData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateAnnouncementData> = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.content.trim()) newErrors.content = "Content is required"
    if (!formData.category.trim()) newErrors.category = "Category is required"
    if (!formData.author.trim()) newErrors.author = "Author is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      await onSubmit(formData)
      // Reset form after successful submission
      setFormData({
        title: "",
        content: "",
        priority: "medium",
        category: "",
        author: "",
      })
      setErrors({})
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const predefinedCategories = [
    "General",
    "Updates",
    "Maintenance",
    "Security",
    "Events",
    "HR",
    "IT",
    "Finance",
    "Marketing",
    "Operations",
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Create Announcement</CardTitle>
            <CardDescription>Share important updates and information with your team</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Title
              </Label>
              <Input
                id="title"
                placeholder="Enter announcement title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Author
              </Label>
              <Input
                id="author"
                placeholder="Your name..."
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className={errors.author ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.author && <p className="text-sm text-red-500">{errors.author}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {predefinedCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                  setFormData({ ...formData, priority: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your announcement content here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className={`min-h-[120px] resize-none ${errors.content ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <Badge className={getPriorityColor(formData.priority)}>
                {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
              </Badge>
            </div>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Publishing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Publish
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

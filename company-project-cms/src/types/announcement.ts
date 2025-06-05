export interface Announcement {
  id: string
  title: string
  content: string
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  author: string
  createdAt: Date
  isActive: boolean
}

export interface CreateAnnouncementData {
  title: string
  content: string
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  author: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

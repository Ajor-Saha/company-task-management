export interface Announcement {
  id: string
  title: string
  content: string
  author: string
  createdAt: Date
  isActive: boolean
}

export interface CreateAnnouncementData {
  title: string
  content: string
  author: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

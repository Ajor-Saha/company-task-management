import type { Announcement, CreateAnnouncementData, ApiResponse } from "../types/announcement"

const API_BASE_URL = "/api/announcements"

// Mock data for fallback
const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "System Maintenance Scheduled",
    content:
      "We will be performing scheduled maintenance on our servers this weekend from 2:00 AM to 6:00 AM EST. During this time, some services may be temporarily unavailable. We apologize for any inconvenience.",
    priority: "high",
    category: "Maintenance",
    author: "IT Team",
    createdAt: new Date("2024-01-15T10:30:00"),
    isActive: true,
  },
  {
    id: "2",
    title: "New Feature Release: Dark Mode",
    content:
      "We're excited to announce the release of dark mode! You can now toggle between light and dark themes in your user settings. This feature has been highly requested and we're happy to deliver it.",
    priority: "medium",
    category: "Updates",
    author: "Product Team",
    createdAt: new Date("2024-01-14T14:15:00"),
    isActive: true,
  },
  {
    id: "3",
    title: "Holiday Office Hours",
    content:
      "Please note that our office will have modified hours during the holiday season. We will be closed on December 25th and January 1st. Regular hours will resume on January 2nd.",
    priority: "low",
    category: "General",
    author: "HR Department",
    createdAt: new Date("2024-01-10T09:00:00"),
    isActive: true,
  },
  {
    id: "4",
    title: "Security Update Required",
    content:
      "All users must update their passwords by the end of this week. Please ensure your new password meets our security requirements: at least 12 characters with a mix of letters, numbers, and symbols.",
    priority: "urgent",
    category: "Security",
    author: "Security Team",
    createdAt: new Date("2024-01-12T16:45:00"),
    isActive: true,
  },
  {
    id: "5",
    title: "Team Building Event",
    content:
      "Join us for our quarterly team building event next Friday at 3 PM in the main conference room. We'll have games, refreshments, and prizes. RSVP by Wednesday.",
    priority: "low",
    category: "Events",
    author: "HR Department",
    createdAt: new Date("2024-01-08T11:20:00"),
    isActive: true,
  },
]

class AnnouncementAPI {
  private useMockData = false

  async fetchAnnouncements(): Promise<ApiResponse<Announcement[]>> {
    try {
      const response = await fetch(API_BASE_URL)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })),
      }
    } catch (error) {
      console.warn("API fetch failed, using mock data:", error)
      this.useMockData = true
      return {
        success: true,
        data: mockAnnouncements,
      }
    }
  }

  async createAnnouncement(data: CreateAnnouncementData): Promise<ApiResponse<Announcement>> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        isActive: true,
      }

      return {
        success: true,
        data: newAnnouncement,
      }
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          ...result,
          createdAt: new Date(result.createdAt),
        },
      }
    } catch (error) {
      console.error("Failed to create announcement:", error)
      return {
        success: false,
        error: "Failed to create announcement",
      }
    }
  }

  async updateAnnouncementStatus(id: string, isActive: boolean): Promise<ApiResponse<Announcement>> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return {
        success: true,
        data: mockAnnouncements.find((a) => a.id === id) as Announcement,
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          ...result,
          createdAt: new Date(result.createdAt),
        },
      }
    } catch (error) {
      console.error("Failed to update announcement:", error)
      return {
        success: false,
        error: "Failed to update announcement",
      }
    }
  }

  async deleteAnnouncement(id: string): Promise<ApiResponse<void>> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return {
        success: true,
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error)
      return {
        success: false,
        error: "Failed to delete announcement",
      }
    }
  }
}

export const announcementAPI = new AnnouncementAPI()

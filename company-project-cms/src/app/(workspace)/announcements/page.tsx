"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Button,
} from "@/components/ui/button"
import {
  Input,
} from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Edit,
  Trash,
} from "lucide-react"
import { announcementAPI } from "@/lib/api"
import type { Announcement } from "@/types/announcement"

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [isPending, startTransition] = useTransition()

  // Edited fields inside dialog
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function loadAnnouncements() {
    setIsLoading(true)
    try {
      const res = await announcementAPI.fetchAnnouncements()
      if (res.success && res.data) {
        setAnnouncements(res.data)
      } else {
        toast.warning("Failed to fetch announcements, showing mock data.")
        // optional: load mock data here
      }
    } catch (e) {
      console.error("Error loading announcements:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = announcements.filter((a) => {
    const term = searchTerm.toLowerCase()
    return (
      a.title.toLowerCase().includes(term) ||
      a.content.toLowerCase().includes(term) ||
      a.author.toLowerCase().includes(term)
    )
  })

  function openEditDialog(announcement: Announcement) {
    setEditingAnnouncement(announcement)
    setEditTitle(announcement.title)
    setEditContent(announcement.content)
  }

  async function saveEdit() {
    if (!editingAnnouncement) return

    try {
      const updatedAnnouncement = {
        ...editingAnnouncement,
        title: editTitle,
        content: editContent,
      }
      const res = await announcementAPI.updateAnnouncement(updatedAnnouncement.id, updatedAnnouncement)
      if (res.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === updatedAnnouncement.id ? updatedAnnouncement : a))
        )
        toast.success("Announcement updated")
        setEditingAnnouncement(null) // close dialog
      } else {
        toast.error("Failed to update announcement")
      }
    } catch (e) {
      console.error(e)
      toast.error("Unexpected error updating announcement")
    }
  }

  async function deleteAnnouncement(id: string) {
    try {
      const res = await announcementAPI.deleteAnnouncement(id)
      if (res.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        toast.success("Announcement deleted")
      } else {
        toast.error("Failed to delete announcement")
      }
    } catch (e) {
      console.error(e)
      toast.error("Unexpected error deleting announcement")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Input
        placeholder="Search announcements..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
        type="search"
        spellCheck={false}
        autoComplete="off"
      />

      {isLoading ? (
        <p>Loading announcements...</p>
      ) : filtered.length === 0 ? (
        <p>No announcements found.</p>
      ) : (
        filtered.map((announcement) => (
          <Card key={announcement.id} className="mb-4">
            <CardHeader className="flex items-center space-x-3">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  announcement.author
                )}&background=4F46E5&color=fff&size=32`}
                alt={`${announcement.author} avatar`}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">{announcement.title}</h3>
                <p className="text-sm text-muted-foreground">{announcement.author}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p>{announcement.content}</p>
              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(announcement)}
                  aria-label={`Edit announcement ${announcement.title}`}
                >
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteAnnouncement(announcement.id)}
                  aria-label={`Delete announcement ${announcement.title}`}
                >
                  <Trash className="mr-1 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Edit Announcement Dialog */}
      <Dialog
        open={!!editingAnnouncement}
        onOpenChange={(open) => !open && setEditingAnnouncement(null)}
      >
        <DialogContent
          className="
            sm:max-w-lg
            bg-white dark:bg-gray-900
            border border-gray-300 dark:border-gray-700
            rounded-lg
            shadow-xl
            p-6
            transition-colors duration-300
          "
        >
          <DialogHeader>
            <DialogTitle
              className="
                text-2xl font-semibold
                text-gray-900 dark:text-gray-100
                mb-4
              "
            >
              Edit Announcement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
              autoFocus
              className="
                w-full
                rounded-md
                border border-gray-300 dark:border-gray-600
                bg-gray-50 dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                px-4 py-3
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors duration-200
              "
            />

            <textarea
              className="
                w-full
                min-h-[140px]
                rounded-md
                border border-gray-300 dark:border-gray-600
                bg-gray-50 dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                px-4 py-3
                resize-y
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors duration-200
              "
              rows={5}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Content"
            />
          </div>

          <DialogFooter className="mt-6 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setEditingAnnouncement(null)}
              disabled={isPending}
              className="
                border-gray-400 dark:border-gray-600
                text-gray-700 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700
                px-5 py-2
                rounded-md
                transition-colors duration-200
              "
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                startTransition(() => saveEdit())
              }}
              disabled={isPending || editTitle.trim() === ""}
              className="
                bg-blue-600 hover:bg-blue-700
                text-white
                disabled:bg-blue-300 disabled:cursor-not-allowed
                px-6 py-2
                rounded-md
                transition-colors duration-200
              "
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  Edit,
  Trash,
  Plus,
  Search,
} from "lucide-react"
import { announcementAPI } from "@/lib/api"
import type { Announcement } from "@/types/announcement"
import Image from "next/image"
import { CreateAnnouncementDialog } from "../_components/create-announcement-dialog"
import { Axios } from "@/config/axios"
import { env } from "@/config/env"
import axios, { type AxiosError } from "axios"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditAnnouncementDialog } from "../_components/edit-announcement-dialog"

interface Employee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  role: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  files: Array<{
    id: string;
    url: string;
  }>;
  mention: Array<{
    type: 'project' | 'employee';
    id: string;
    details: {
      id?: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
      role?: string;
      name?: string;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    role: string;
  };
}

interface PaginatedResponse {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function Announcements() {
  const [posts, setPosts] = useState<Post[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(5)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Fetch employees
  const loadEmployees = useCallback(async () => {
    setIsLoadingEmployees(true)
    try {
      const response = await Axios.get('/api/employee/get-company-employee')
      if (response.data?.success) {
        setEmployees(response.data.data)
      } else {
        toast.error("Failed to fetch employees")
      }
    } catch (error) {
      console.error("Error loading employees:", error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message ?? "Failed to fetch employees"
        toast.error(errorMessage)
      } else {
        toast.error("Failed to fetch employees")
      }
    } finally {
      setIsLoadingEmployees(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const loadPosts = useCallback(async (page: number, userId?: string) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (userId && userId !== "all") {
        queryParams.append('userId', userId)
      }

      const response = await Axios.get(
        `/api/post/get-company-posts?${queryParams}`
      )

      if (response.data?.success) {
        setPosts(response.data.data.posts)
        setTotalPages(response.data.data.pagination.totalPages)
      } else {
        toast.error("Failed to fetch posts")
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message ?? "Failed to fetch posts"
        toast.error(errorMessage)
      } else {
        toast.error("Failed to fetch posts")
      }
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadPosts(currentPage, selectedUser)
  }, [currentPage, selectedUser, loadPosts])

  const handleCreateSuccess = () => {
    loadPosts(1) // Reset to first page after creating new post
    setCurrentPage(1)
  }

  // Filter posts based on search term
  const filteredPosts = posts.filter((post) => {
    const term = searchTerm.toLowerCase()
    return (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      `${post.user.firstName} ${post.user.lastName}`.toLowerCase().includes(term)
    )
  })

  const handleEditSuccess = () => {
    loadPosts(currentPage, selectedUser);
    setIsEditDialogOpen(false);
    setEditingPost(null);
  };

  const handleDelete = async (post: Post) => {
    try {
      setIsDeleting(true)
      const response = await Axios.delete(`/api/post/delete-post/${post.id}`)

      if (response.data?.success) {
        toast.success("Post deleted successfully")
        
        // Update local state
        setPosts((prevPosts) => {
          const remainingPosts = prevPosts.filter((p) => p.id !== post.id)
          
          // If we deleted the last post on the current page and we're not on the first page
          if (remainingPosts.length === 0 && currentPage > 1) {
            // Go to previous page
            setCurrentPage((prev) => prev - 1)
          } else {
            // Reload current page to ensure correct pagination
            loadPosts(currentPage, selectedUser)
          }
          
          return remainingPosts
        })
      } else {
        toast.error("Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message ?? "Failed to delete post"
        toast.error(errorMessage)
      } else {
        toast.error("An unexpected error occurred")
      }
    } finally {
      setIsDeleting(false)
      setPostToDelete(null)
    }
  }

  const handlePageChange = (newPage: number) => {
    // Ensure page number is within valid range
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(validPage);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 h-10 bg-background border-border"
            type="search"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <Select 
          value={selectedUser} 
          onValueChange={(value) => {
            setSelectedUser(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[220px] h-10">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {!isLoadingEmployees && employees.map((employee) => (
              <SelectItem 
                key={employee.userId} 
                value={employee.userId}
                className="focus:bg-accent focus:text-accent-foreground"
              >
                <div className="flex items-center gap-2 py-1">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{employee.firstName} {employee.lastName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No posts found.
        </div>
      ) : (
        <>
          {filteredPosts.map((post) => (
            <Card key={post.id} className="mb-4">
              <CardHeader className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={post.user.avatar} alt={`${post.user.firstName} ${post.user.lastName}`} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {post.user.firstName[0]}{post.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {post.user.firstName} {post.user.lastName}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p>{post.content}</p>
                
                {/* Display mentions if any */}
                {post.mention && post.mention.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.mention.map((mention, index) => (
                      <div
                        key={`${mention.type}-${mention.id}-${index}`}
                        className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                      >
                        {mention.type === 'employee' && mention.details && (
                          <span>{mention.details.firstName} {mention.details.lastName}</span>
                        )}
                        {mention.type === 'project' && mention.details && (
                          <span>{mention.details.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Display files if any */}
                {post.files && post.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {post.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        📎 Attachment
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPost(post);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => setPostToDelete(post)}
                  >
                    <Trash className="mr-1 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}
                  />
                </PaginationItem>

                {/* First page */}
                {totalPages > 0 && (
                  <PaginationItem>
                    <PaginationLink 
                      onClick={() => handlePageChange(1)}
                      isActive={currentPage === 1}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}

                {/* Left ellipsis */}
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Middle pages */}
                {totalPages > 1 && Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  // Show current page and one page before and after
                  if (
                    pageNumber !== 1 &&
                    pageNumber !== totalPages &&
                    pageNumber >= currentPage - 1 &&
                    pageNumber <= currentPage + 1
                  ) {
                    return (
                      <PaginationItem key={`page-${pageNumber}`}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={pageNumber === currentPage}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                {/* Right ellipsis */}
                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Last page */}
                {totalPages > 1 && (
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => handlePageChange(totalPages)}
                      isActive={currentPage === totalPages}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      {/* Create Post Dialog */}
      <CreateAnnouncementDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Post Dialog */}
      <EditAnnouncementDialog
        post={editingPost}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingPost(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Add the Alert Dialog for delete confirmation */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent className="dark:bg-slate-950 dark:text-white bg-slate-200 text-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              and all associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (postToDelete) {
                  handleDelete(postToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

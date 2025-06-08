"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Loader2, Upload, X, FileText } from "lucide-react"
import { Axios } from "@/config/axios"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { AxiosError } from "axios"

interface Employee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'document';
  id?: string; // For existing files
  url?: string; // For existing files
}

interface Mention {
  type: 'project' | 'employee';
  id: string;
  details?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role?: string;
    name?: string;
  } | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  files: Array<{
    id: string;
    url: string;
  }>;
  mention: Mention[];
}

interface EditAnnouncementDialogProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const mentionSchema = z.object({
  type: z.enum(['project', 'employee']),
  id: z.string(),
});

const editAnnouncementSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(5, { message: "Content must be at least 5 characters" }),
  mentions: z.array(mentionSchema),
});

export function EditAnnouncementDialog({
  post,
  isOpen,
  onClose,
  onSuccess,
}: EditAnnouncementDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [files, setFiles] = useState<FilePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const form = useForm<z.infer<typeof editAnnouncementSchema>>({
    resolver: zodResolver(editAnnouncementSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      mentions: post?.mention || [],
    },
  });

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
        mentions: post.mention,
      });

      // Convert existing files to FilePreview format
      const existingFiles: FilePreview[] = post.files.map(file => ({
        preview: file.url,
        type: file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'document',
        id: file.id,
        url: file.url,
        file: new File([], "placeholder"), // This is just for type compatibility
      }));
      setFiles(existingFiles);
    }
  }, [post, form]);

  const mentions = form.watch('mentions');

  const fetchProjectsAndEmployees = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await Axios.get(
        `/api/company/get-projects-and-employees`
      )

      if (response.data?.success) {
        setProjects(response.data.data.projects)
        setEmployees(response.data.data.employees)
      } else {
        toast.error("Failed to fetch projects and employees")
      }
    } catch (error) {
      console.error("Error fetching projects and employees:", error)
      toast.error("An error occurred while fetching data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchProjectsAndEmployees()
    }
  }, [isOpen, fetchProjectsAndEmployees])

  const resetForm = useCallback(() => {
    form.reset()
    setFiles([])
  }, [form])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  // File handling functions (same as CreateAnnouncementDialog)
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "File type not supported";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 5MB limit";
    }
    return null;
  }

  const handleFileChange = useCallback(async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;

    const newFiles: FilePreview[] = [];
    const fileArray = Array.from(uploadedFiles);

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      if (isImage) {
        const preview = URL.createObjectURL(file);
        newFiles.push({ file, preview, type: 'image' });
      } else {
        newFiles.push({ file, preview: '', type: 'document' });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Drag and drop handlers (same as CreateAnnouncementDialog)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].type === 'image' && !newFiles[index].url) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  // Mention handling functions (same as CreateAnnouncementDialog)
  const handleAddMention = (type: 'project' | 'employee', id: string) => {
    const newMention = { type, id };
    const exists = mentions.some(
      m => m.type === type && m.id === id
    );
    
    if (!exists) {
      const updatedMentions = [...mentions, newMention];
      form.setValue('mentions', updatedMentions, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleRemoveMention = (type: 'project' | 'employee', id: string) => {
    const updatedMentions = mentions.filter(
      m => !(m.type === type && m.id === id)
    );
    form.setValue('mentions', updatedMentions, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const getMentionLabel = (mention: Mention) => {
    if (mention.type === 'project') {
      const project = projects.find(p => p.id === mention.id);
      return project ? project.name : mention.details?.name || '';
    } else {
      const employee = employees.find(e => e.userId === mention.id);
      return employee ? 
        `${employee.firstName} ${employee.lastName}` : 
        mention.details ? 
          `${mention.details.firstName} ${mention.details.lastName}` : 
          '';
    }
  };

  const onSubmit = async (data: z.infer<typeof editAnnouncementSchema>) => {
    if (!post) return;

    try {
      console.log('Starting form submission with data:', data);
      setIsLoading(true);
      
      const formData = new FormData();
      
      // Ensure title and content are properly trimmed strings
      formData.append('title', String(data.title).trim());
      formData.append('content', String(data.content).trim());
      
      // Handle mentions
      if (data.mentions && data.mentions.length > 0) {
        formData.append('mention', JSON.stringify(data.mentions));
      }
      
      // Handle file uploads
      const newFiles = files.filter(f => !f.url);
      newFiles.forEach(filePreview => {
        formData.append('files', filePreview.file);
      });

      // Handle existing files
      const existingFiles = files
        .filter(f => f.url && f.id)
        .map(f => ({ id: f.id, url: f.url }));
      
      if (existingFiles.length > 0) {
        formData.append('existingFiles', JSON.stringify(existingFiles));
      }
      
      const response = await Axios.put(
        `/api/post/edit-post/${post.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      if (response.data?.success) {
        toast.success("Post updated successfully");
        onSuccess();
        handleClose();
      } else {
        toast.error(response.data.message || "Failed to update post");
      }
    } catch (error) {
      console.error("Update Post Error:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      
      if (axiosError.code === 'ECONNABORTED') {
        toast.error("Request timed out. Please try again.");
      } else {
        const errorMessage =
          axiosError.response?.data?.message ?? "Failed to update post. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.type === 'image' && !file.url) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 dark:bg-slate-950 bg-slate-200 text-slate-950 dark:text-slate-200 h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 flex-none">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Edit Post
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6">
            {/* Same form fields as CreateAnnouncementDialog */}
            <div className="py-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Post title"
                            className="h-11 text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select onValueChange={(value) => handleAddMention('project', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Mention project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem 
                              key={project.id} 
                              value={project.id}
                              className="py-2.5"
                            >
                              <div className="flex items-center">
                                <span className="font-medium">{project.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select onValueChange={(value) => handleAddMention('employee', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Mention employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem 
                              key={employee.userId} 
                              value={employee.userId}
                              className="py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border border-border">
                                  <AvatarImage 
                                    src={employee.avatar} 
                                    alt={`${employee.firstName} ${employee.lastName}`} 
                                  />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {employee.firstName[0]}{employee.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {employee.firstName} {employee.lastName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {employee.role}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Mentions Display */}
                    {mentions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mentions.map((mention, index) => (
                          <div
                            key={`${mention.type}-${mention.id}-${index}`}
                            className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                          >
                            <span>{getMentionLabel(mention)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMention(mention.type, mention.id)}
                              className="hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Write your post..."
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Upload Area */}
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 transition-colors",
                      isDragging ? "border-primary bg-primary/5" : "border-border",
                      "relative"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept={ALLOWED_FILE_TYPES.join(',')}
                    />
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">
                          Support for images, PDFs and documents (max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* File Preview Area */}
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {files.map((file, index) => (
                        <div 
                          key={index}
                          className="relative group border rounded-lg p-2 hover:bg-muted/50 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          
                          {file.type === 'image' ? (
                            <div className="relative aspect-square">
                              <img
                                src={file.preview}
                                alt={file.url ? "Existing file" : file.file.name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {file.url ? "Document" : file.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {file.url ? "Existing file" : `${(file.file.size / 1024).toFixed(1)} KB`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </Form>

        <DialogFooter className="px-6 py-4 bg-muted/10 flex-none">
          <div className="flex justify-end gap-4 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              type="button"
              disabled={form.formState.isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting || isLoading || !form.formState.isValid}
              className="px-8"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
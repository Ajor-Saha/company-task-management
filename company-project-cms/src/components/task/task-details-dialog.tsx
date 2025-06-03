import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { env } from "@/config/env";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Clipboard, Clock, Loader2, User2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import RichTextEditor, { RichTextEditorHandle } from "../editor/RichTextEditor";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Axios } from "@/config/axios";
import Image from "next/image";
import { Input } from "../ui/input";
import { FileIcon, PackageIcon, XIcon, UploadIcon, FileTextIcon, FileImageIcon, FilmIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskFile {
  id: string;
  url: string;
}

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    name: string;
    status: string;
    description?: string | null;
    endDate?: string | null;
    projectId?: string | null;
    projectName?: string | null;
    createdAt: string;
    updatedAt: string;
    taskFiles?: TaskFile[];
  };
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  onTaskUpdate?: () => void;
}

interface UploadedFile {
  id: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
  userId,
  firstName,
  lastName,
  avatar,
  onTaskUpdate,
}: TaskDetailsDialogProps) {
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    task.endDate ? new Date(task.endDate) : undefined
  );
  const [status, setStatus] = useState(task.status);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>(task.taskFiles || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update taskFiles when task prop changes
  useEffect(() => {
    setTaskFiles(task.taskFiles || []);
  }, [task.taskFiles]);

  const updateTask = async (updateData: {
    description?: string;
    status?: string;
    endDate?: string | null;
  }) => {
    try {
      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/task/update-task/${task.id}`,
        updateData
      );

      if (response.data?.success) {
        toast.success("Task updated successfully");
        onTaskUpdate?.();
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Update Task Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update task"
      );
      throw error;
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = e.target.value;
    
    // Only proceed if a complete date is selected (value will be in YYYY-MM-DD format)
    if (selectedValue && selectedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const newDate = new Date(selectedValue);
      
      // Check if it's a valid date and different from current
      if (newDate instanceof Date && !isNaN(newDate.getTime()) && 
          newDate.toISOString().split('T')[0] !== date?.toISOString().split('T')[0]) {
        setDate(newDate);
        try {
          setIsLoading(true);
          await updateTask({
            endDate: newDate.toISOString(),
          });
        } catch (error) {
          setDate(task.endDate ? new Date(task.endDate) : undefined);
        } finally {
          setIsLoading(false);
        }
      }
    } else if (!selectedValue) {
      // Handle clearing the date
      setDate(undefined);
      try {
        setIsLoading(true);
        await updateTask({
          endDate: null,
        });
      } catch (error) {
        setDate(task.endDate ? new Date(task.endDate) : undefined);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const description = editorRef.current?.getContent() || undefined;
      const updatedTask = await updateTask({
        description,
        status,
        endDate: date ? date.toISOString() : null,
      });
      if (updatedTask) {
        onTaskUpdate?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update task"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" is too large. Maximum file size is 10MB.`);
      return false;
    }
    return true;
  };

  const uploadFiles = async (files: FileList) => {
    // Validate all files first
    const validFiles = Array.from(files).filter(validateFileSize);
    
    if (validFiles.length === 0) {
      return;
    }

    if (validFiles.length !== files.length) {
      toast.warning(`${files.length - validFiles.length} file(s) were skipped due to size limit.`);
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('files', file);
      });


      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/task/upload-task-files/${task.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success) {
        const uploadedFiles: UploadedFile[] = response.data.data.files || [];
        const updatedTaskFiles: TaskFile[] = response.data.data.task?.taskFiles || [];
        
        setTaskFiles(updatedTaskFiles);
        
        toast.success(
          `${uploadedFiles.length} file(s) uploaded successfully`
        );
        
        // Update the task data
        onTaskUpdate?.();
      } else {
        throw new Error(response.data.message || "Failed to upload files");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload files"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    await uploadFiles(files);
  };
  
  const handleFileDelete = async (fileId: string) => {
    const fileToDelete = taskFiles.find(f => f.id === fileId);
    if (!fileToDelete) {
      toast.error("File not found");
      return;
    }

    setIsLoading(true);
    try {
      const response = await Axios.delete(
        `${env.BACKEND_BASE_URL}/api/task/delete-task-file?taskId=${task.id}&fileId=${fileId}`
      );

      if (response.data?.success) {
        // Optimistically update the UI
        setTaskFiles(prev => prev.filter(f => f.id !== fileId));
        toast.success(`File "${getFileNameFromUrl(fileToDelete.url)}" deleted successfully`);
        onTaskUpdate?.();
      } else {
        throw new Error(response.data.message || "Failed to delete file");
      }
    } catch (error) {
      console.error("File delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete file"
      );
      // Revert to original task files on error
      setTaskFiles(task.taskFiles || []);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileIcon;
    if (mimeType.startsWith('image/')) return FileImageIcon;
    if (mimeType.startsWith('video/')) return FilmIcon;
    if (mimeType.startsWith('text/')) return FileTextIcon;
    return FileIcon;
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
    
    // Reset the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Remove the nanoid prefix (format: nanoid-filename)
      const dashIndex = fileName.indexOf('-');
      if (dashIndex !== -1) {
        return decodeURIComponent(fileName.substring(dashIndex + 1));
      }
      
      return decodeURIComponent(fileName);
    } catch (error) {
      return 'Unknown file';
    }
  };

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] p-0 bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-200">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            {task.name}
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>Task Details</span>
            <Badge
              variant={
                task.status === "to-do"
                  ? "outline"
                  : task.status === "in-progress"
                  ? "secondary"
                  : task.status === "hold"
                  ? "destructive"
                  : "default"
              }
              className="capitalize"
            >
              {task.status}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 max-h-[calc(80vh-180px)]">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <h4 className="font-medium">Project</h4>
              {task.projectId ? (
                <Link
                  href={`/project/details/${task.projectId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {task.projectName}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No project assigned
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> Due Date
                </h4>
                <Input
                  type="date"
                  value={date ? date.toISOString().split('T')[0] : ''}
                  onChange={handleDateChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Status
                </h4>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to-do">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User2 className="h-4 w-4" /> Assigned To
                </h4>
                <div className="flex items-center space-x-2">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={`${firstName} ${lastName}`}
                      className="h-6 w-6 rounded-full object-cover"
                      width={24}
                      height={24}
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {firstName && lastName
                      ? `${firstName} ${lastName}`
                      : "Unassigned"}
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="grid gap-2">
              <h4 className="font-medium flex items-center gap-2">
                <PackageIcon className="h-4 w-4" /> Task Files
                {taskFiles.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {taskFiles.length}
                  </Badge>
                )}
              </h4>
              
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 transition-colors",
                  "hover:border-primary/50 cursor-pointer",
                  isDragging ? "border-primary bg-primary/5" : "border-muted",
                  isUploading && "pointer-events-none opacity-50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm font-medium">
                        Uploading files...
                      </p>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Drag & drop files here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Support all file types up to 10MB • Multiple files supported
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  disabled={isUploading}
                  className="hidden"
                />
              </div>

              {/* Files List */}
              {taskFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {taskFiles.length} file(s) attached
                  </p>
                  {taskFiles.map((file) => {
                    const fileName = getFileNameFromUrl(file.url);
                    const FileTypeIcon = getFileIcon();
                    
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-background">
                            <FileTypeIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              Attached file
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            asChild
                          >
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <FileIcon className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:text-destructive"
                            onClick={() => handleFileDelete(file.id)}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="py-4">
              <h4 className="font-medium mb-2">Description:</h4>
              <RichTextEditor
                ref={editorRef}
                initialContent={task.description || ""}
                key={task.id}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4">
          <Button
            className="px-8 py-2"
            onClick={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

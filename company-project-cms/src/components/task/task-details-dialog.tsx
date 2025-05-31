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
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Axios } from "@/config/axios";
import Image from "next/image";
import { Input } from "../ui/input";

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
  };
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  onTaskUpdate?: () => void;
}

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
            disabled={isSaving}
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

"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AxiosError } from "axios";
import RichTextEditor, { RichTextEditorHandle } from "@/components/editor/RichTextEditor";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddTaskDialogProps {
  projectId: string;
  onTaskAdded: () => void;
}

interface Employee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

const taskSchema = z.object({
  name: z.string().min(3, { message: "Task name must be at least 3 characters" }),
  assignee: z.string().min(1, { message: "Please select an assignee" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  dueDate: z.string().optional(),
});

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  projectId,
  onTaskAdded,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [editorKey, setEditorKey] = useState(0);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      assignee: "",
      description: "",
      dueDate: "",
    },
  });

  // Reset form and editor when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      form.reset();
      setEditorKey(prev => prev + 1);
    }
  }, [dialogOpen, form]);

  // Update form description field when editor content changes
  useEffect(() => {
    const interval = setInterval(() => {
      const content = editorRef.current?.getContent() || "";
      if (content !== form.getValues("description")) {
        form.setValue("description", content, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [form]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/employee/get-company-employee`
      );
      if (response.data?.success) {
        setAvailableEmployees(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (dialogOpen) {
      fetchEmployees();
    }
  }, [dialogOpen, fetchEmployees]);

  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    const description = editorRef.current?.getContent() || "";
    if (!description || description.trim().length < 5) {
      form.setError("description", {
        type: "manual",
        message: "Description must be at least 5 characters",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const endDate = data.dueDate ? new Date(data.dueDate).toISOString() : null;
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/task/create-new-task`,
        {
          name: data.name,
          assignedTo: data.assignee,
          description,
          projectId,
          endDate,
          status: "to-do",
        }
      );
      if (response.data?.success) {
        toast.success(response.data.message || "Task added successfully");
        onTaskAdded();
        form.reset();
        setEditorKey(prev => prev + 1);
        setDialogOpen(false);
      } else {
        console.error("Add Task Error:", response.data.message);
        toast.error(response.data.message || "Failed to add task");
      }
    } catch (error) {
      console.error("Add Task Error:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data.message ?? "Failed to add task. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 flex items-center">
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Add Task
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[425px] lg:max-w-[650px] p-0 bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
            <DialogHeader className="px-6 pt-6 pb-4 flex-none">
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Enter the details for the new task. Click save when you're done.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 overflow-y-auto">
              <div className="grid gap-6 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel htmlFor="name" className="text-right">
                        Name
                      </FormLabel>
                      <div className="col-span-3">
                        <Input
                          id="name"
                          placeholder="Enter task name"
                          {...field}
                          className="w-full text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                        />
                        <FormMessage className="text-xs mt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignee"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel htmlFor="assignee" className="text-right">
                        Assignee
                      </FormLabel>
                      <div className="col-span-3">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableEmployees.map((employee) => (
                              <SelectItem key={employee.userId} value={employee.userId}>
                                <div className="flex items-center gap-2">
                                  <Image
                                    src={employee.avatar || "/asset/avatar-pic.png"}
                                    alt={employee.firstName}
                                    width={24}
                                    height={24}
                                    className="rounded-full object-cover"
                                  />
                                  <span>
                                    {employee.firstName} {employee.lastName}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-start gap-4">
                      <FormLabel htmlFor="description" className="text-right pt-2">
                        Description
                      </FormLabel>
                      <div className="col-span-3">
                        <RichTextEditor
                          ref={editorRef}
                          initialContent=""
                          key={`add-task-editor-${editorKey}`}
                        />
                        <FormMessage className="text-xs mt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel htmlFor="dueDate" className="text-right">
                        Due Date
                      </FormLabel>
                      <div className="col-span-3">
                        <Input
                          type="date"
                          id="dueDate"
                          {...field}
                          className="w-full text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                        />
                        <FormMessage className="text-xs mt-1" />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 mt-auto border-t flex-none">
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Save Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
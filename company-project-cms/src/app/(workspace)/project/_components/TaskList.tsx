"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UserCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { statusColors } from "@/constants";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import axios from "axios";
import { ColorRing } from "react-loader-spinner";
import AddTaskDialog from "./AddTaskDialog";
import Image from "next/image";
import { toast } from "sonner";

interface AssignedTo {
  userId: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Subtask {
  id: string;
  name: string;
  description: string | null;
  assignedTo: AssignedTo;
  projectId: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SubtasksTableProps {
  projectId: string;
}

const SubtasksTable: React.FC<SubtasksTableProps> = ({ projectId }) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableAssignees, setAvailableAssignees] = useState<AssignedTo[]>([]);

  // Fetch available assignees (users) from the API
  const fetchAssignees = useCallback(async () => {
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/employee/get-company-employee`
      );
      if (response.data?.success) {
        setAvailableAssignees(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching assignees:", err);
    }
  }, []);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  // Function to update task via API
  const updateTask = async (taskId: string, updateData: { status?: string; endDate?: string | null; assignedTo?: string }) => {
    try {
      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/task/update-task/${taskId}`,
        updateData
      );
      if (response.data?.success) {
        return response.data.data;
      } else {
        console.error("Update Task Error:", response.data.message);
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Update Task Error:", error);
      throw error;
    }
  };

  // Handle status change with API update
  const handleStatusChange = async (index: number, newStatus: string) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index].status = newStatus;
    setSubtasks(updatedSubtasks);

    try {
      await updateTask(subtasks[index].id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Handle assignee change with API update
  const handleAssigneeChange = async (index: number, newAssigneeId: string) => {
    const updatedSubtasks = [...subtasks];
    const newAssignee = availableAssignees.find((user) => user.userId === newAssigneeId);
    if (newAssignee) {
      updatedSubtasks[index].assignedTo = {
        userId: newAssignee.userId,
        firstName: newAssignee.firstName,
        lastName: newAssignee.lastName,
        avatar: newAssignee.avatar,
      };
      setSubtasks(updatedSubtasks);

      try {
        await updateTask(subtasks[index].id, { assignedTo: newAssigneeId });
      } catch (error) {
        console.error("Failed to update assignee:", error);
      }
    }
  };

  // Handle due date change with API update
  const handleDueDateChange = async (index: number, date: Date | undefined) => {
    const updatedSubtasks = [...subtasks];
    const newEndDate = date ? date.toISOString() : null;
    updatedSubtasks[index].endDate = newEndDate;
    setSubtasks(updatedSubtasks);

    try {
      await updateTask(subtasks[index].id, { endDate: newEndDate });
    } catch (error) {
      console.error("Failed to update due date:", error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await Axios.delete(
        `${env.BACKEND_BASE_URL}/api/task/delete-task/${taskId}`
      );
      if (response.data?.success) {
        setSubtasks((prevSubtasks) => prevSubtasks.filter((task) => task.id !== taskId));
        toast.success(response.data.message);
        fetchProjectTasks(); // Refresh the task list
      } else {
        console.error("Delete Task Error:", response.data.message);
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Delete Task Error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", error.response?.data);
      }
    }
  };

  // Fetch tasks from API
  const fetchProjectTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/task/get-project-tasks/${projectId}`
      );
      if (response.data?.success) {
        setSubtasks(response.data.data);
      } else {
        console.error("API Error Message:", response.data.message);
      }
    } catch (error) {
      console.error("FetchProjects Error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectTasks();
  }, [fetchProjectTasks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <ColorRing
          visible={true}
          height="80"
          width="80"
          colors={["#e15b64", "#f47e60", "#f8b26a", "#abbd81", "#849b87"]}
          ariaLabel="color-ring-loading"
          wrapperStyle={{}}
          wrapperClass="color-ring-wrapper"
        />
        Please wait...
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Subtasks{" "}
          <span className="text-gray-500 dark:text-gray-400">
            {subtasks.length}/5
          </span>
        </h2>
        <div className="flex space-x-2">
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4h18M3 4l4 4m-4-4l4-4m14 0l-4 4m4-4l-4-4"
              ></path>
            </svg>
          </button>
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
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
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            Suggest subtasks
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
              <TableHead className="py-2">Name</TableHead>
              <TableHead className="py-2">Assignee</TableHead>
              <TableHead className="py-2">Due date</TableHead>
              <TableHead className="py-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subtasks.map((subtask, index) => (
              <TableRow
                key={subtask.id}
                className={`border-t border-gray-200 dark:border-gray-700 ${
                  statusColors[subtask.status as keyof typeof statusColors] ||
                  "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <TableCell className="py-2 flex items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <input type="checkbox" className="mr-2" />
                    </PopoverTrigger>
                    <PopoverContent className="w-40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      <div className="flex flex-col space-y-2">
                        {[
                          "to-do",
                          "in-progress",
                          "completed",
                          "review",
                          "hold",
                        ].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(index, status)}
                            className={`text-left px-2 py-1 rounded ${
                              statusColors[
                                status as keyof typeof statusColors
                              ] || "bg-gray-100 dark:bg-gray-800"
                            } hover:opacity-80`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <span>{subtask.name}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({subtask.status})
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-gray-600 flex dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                        <Image
                          src={subtask.assignedTo.avatar || "/asset/avatar-pic.png"}
                          alt={`${subtask.assignedTo.firstName} ${subtask.assignedTo.lastName}`}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {subtask.assignedTo.firstName} {subtask.assignedTo.lastName}
                  </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      <div className="flex flex-col space-y-2">
                        {availableAssignees.map((user) => (
                          <button
                            key={user.userId}
                            onClick={() => handleAssigneeChange(index, user.userId)}
                            className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Image
                              src={user.avatar || "/asset/avatar-pic.png"}
                              alt={`${user.firstName} ${user.lastName}`}
                              width={24}
                              height={24}
                              className="rounded-full object-cover"
                            />
                            <span>{user.firstName} {user.lastName}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                </TableCell>
                <TableCell className="py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        {subtask.endDate
                          ? format(new Date(subtask.endDate), "PPP")
                          : "Pick a date"}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800">
                      <Calendar
                        mode="single"
                        selected={
                          subtask.endDate
                            ? new Date(subtask.endDate)
                            : undefined
                        }
                        onSelect={(date) => handleDueDateChange(index, date)}
                        initialFocus
                        className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell className="py-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="w-5 h-5 text-red-600 dark:text-red-400 cursor-pointer">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
                          />
                        </svg>
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete this task.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTask(subtask.id)}
                        >
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} className="py-2">
                <AddTaskDialog projectId={projectId} onTaskAdded={fetchProjectTasks} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SubtasksTable;
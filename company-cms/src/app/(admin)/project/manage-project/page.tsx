"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Users,
  UserPlus,
  X,
  EyeClosedIcon,
  EyeOffIcon,
  EyeIcon,
  Check,
  Edit,
  Delete,
} from "lucide-react";
import { format, set } from "date-fns";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import axios from "axios";
import { toast } from "sonner";
import { ColorRing } from "react-loader-spinner";
import AssignEmployeeDialog from "../_components/AssignEmployeeDialog";
import EditProjectDialog from "../_components/EditProjectDialog";
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
import { useRouter } from "next/navigation";

interface Employee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  assignedEmployees?: Employee[];
  taskCount: number;
  assignedEmployeeCount: number;
}

export default function ManageProject() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();

  const openAssignDialog = async (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
    setStatusMessage(null);
  };

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-admin-projects`
      );
      if (response.data?.success) {
        setAllProjects(response.data.data);
      } else {
        console.error("API Error Message:", response.data.message);
      }
    } catch (error) {
      console.error("FetchProjects Error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", error.response?.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await Axios.delete(
        `${env.BACKEND_BASE_URL}/api/project/delete-project/${projectId}`
      );
      if (response.data.success) {
        toast.success("Project deleted successfully");
        fetchProjects(); // refresh list
      } else {
        toast.error(response.data.message || "Failed to delete project");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Project Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your projects and team assignments
        </p>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-md flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-slate-900"
              : "bg-red-100 text-red-800"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-2 p-1 rounded-full hover:bg-black/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableCaption>List of current projects</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead className="hidden md:table-cell text-center">
                Total Tasks
              </TableHead>
              <TableHead className="text-center">Assigned</TableHead>
              <TableHead className="hidden md:table-cell text-center">
                Created
              </TableHead>
              <TableHead className="hidden lg:table-cell text-center">
                Deadline
              </TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <ColorRing
                      visible={true}
                      height="80"
                      width="80"
                      colors={[
                        "#e15b64",
                        "#f47e60",
                        "#f8b26a",
                        "#abbd81",
                        "#849b87",
                      ]}
                      ariaLabel="color-ring-loading"
                      wrapperStyle={{}}
                      wrapperClass="color-ring-wrapper"
                    />
                    Please wait...
                  </div>
                </TableCell>
              </TableRow>
            ) : allProjects.length > 0 ? (
              allProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    {project.taskCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="whitespace-nowrap">
                      {project.assignedEmployeeCount} {project.assignedEmployeeCount === 1 ? 'employee' : 'employees'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    {format(project.createdAt, "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-center">
                    {format(project.updatedAt, "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openAssignDialog(project)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Assign Employee</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Delete className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-black text-black dark:text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-black dark:text-white">
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-black dark:text-white">
                                This action cannot be undone. This will permanently delete the project
                                <strong className="text-red-600"> {project.name}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog for assigning employees */}
      <AssignEmployeeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        project={selectedProject}
        onRefreshProjects={fetchProjects}
      />
      {/* Dialog for editing project */}
      <EditProjectDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        project={selectedProject}
        onRefreshProjects={fetchProjects}
      />
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Loader2,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Triangle } from "react-loader-spinner";
import { DatePickerComp } from "../../_components/date-picker";
import ChatWidget from "../../_components/ChatWidget";
import SubtasksTable from "../../_components/TaskList";
import RichTextEditor from "@/components/editor/RichTextEditor";

// Define the type for the RichTextEditor ref
type RichTextEditorHandle = {
  getContent: () => string;
};

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: "to-do" | "in-progress" | "review" | "completed" | "hold";
  companyId: string;
  startDate: string;
  endDate: string;
}

const statusOptions = [
  { value: "to-do", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "completed", label: "Completed" },
  { value: "hold", label: "On Hold" },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const editorRef = useRef<RichTextEditorHandle>(null);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-project-details/${projectId}`
      );

      if (response.data.success) {
        const proj: ProjectDetails = response.data.data;
        setProject(proj);
        setStartDate(new Date(proj.startDate));
        setEndDate(new Date(proj.endDate));
      } else {
        setError(response.data.message || "Failed to fetch project details");
        toast.error(response.data.message || "Failed to fetch project details");
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
      setError("An error occurred while fetching project details");
      toast.error("An error occurred while fetching project details");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const updateProjectStatus = async (newStatus: string) => {
    if (!project || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const response = await Axios.patch(
        `${env.BACKEND_BASE_URL}/api/project/update-project-status/${project.id}`,
        { status: newStatus }
      );

      if (response.data.success) {
        setProject({
          ...project,
          status: newStatus as ProjectDetails["status"],
        });
        toast.success("Project status updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update project status");
      }
    } catch (err) {
      console.error("Error updating project status:", err);
      toast.error("An error occurred while updating project status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateProjectDescription = async () => {
    if (!project) return;

    setIsSavingDescription(true);
    const rawDescription = editorRef.current?.getContent() || "";
    const description =
      rawDescription === "<p><br></p>" || rawDescription.trim() === ""
        ? ""
        : rawDescription;

    try {
      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/project/update-project-description/${project.id}`,
        { description }
      );

      if (response.data.success) {
        setProject({ ...project, description });
        toast.success("Project description updated successfully");
      } else {
        toast.error(
          response.data.message || "Failed to update project description"
        );
      }
    } catch (err) {
      console.error("Error updating project description:", err);
      toast.error("An error occurred while updating project description");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const updateProjectDates = async (newStartDate?: Date, newEndDate?: Date) => {
    if (!project || isUpdatingDates) return;

    setIsUpdatingDates(true);
    try {
      const payload: { startDate?: string; endDate?: string } = {};
      if (newStartDate) {
        payload.startDate = newStartDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      }
      if (newEndDate) {
        payload.endDate = newEndDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      }

      const response = await Axios.put(
        `${env.BACKEND_BASE_URL}/api/project/update-project/${project.id}`,
        payload
      );

      if (response.data.success) {
        const updatedProject = {
          ...project,
          ...(newStartDate && { startDate: payload.startDate! }),
          ...(newEndDate && { endDate: payload.endDate! }),
        };
        setProject(updatedProject);
        if (newStartDate) setStartDate(newStartDate);
        if (newEndDate) setEndDate(newEndDate);
        toast.success("Project dates updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update project dates");
      }
    } catch (err) {
      console.error("Error updating project dates:", err);
      toast.error("An error occurred while updating project dates");
    } finally {
      setIsUpdatingDates(false);
    }
  };

  const updateStartDate = (newDate: Date) => {
    updateProjectDates(newDate, undefined);
  };

  const updateEndDate = (newDate: Date) => {
    updateProjectDates(undefined, newDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Triangle
          visible={true}
          height="80"
          width="80"
          color="#4fa94d"
          ariaLabel="triangle-loading"
          wrapperStyle={{}}
          wrapperClass=""
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link href="/project/all-project">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">Project not found</p>
        <Button asChild>
          <Link href="/project/all-project">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/project/all-project">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
            </div>
            <Select
              value={project.status}
              onValueChange={updateProjectStatus}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  {isUpdatingStatus ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded-full text-sm">
                      {statusOptions.find((opt) => opt.value === project.status)
                        ?.label || "Select Status"}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Project Status</SelectLabel>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="px-2 py-1 rounded-full">
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center mb-3">
                  <DollarSign className="h-5 w-5 text-primary mr-2" />
                  <p className="text-sm font-medium text-primary">Budget</p>
                </div>
                <div className="pl-7">
                  <p className="font-medium text-lg">
                    {formatCurrency(project.budget)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center mb-3 gap-2">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <p className="text-sm font-medium text-primary">Start Date</p>
                </div>
                <DatePickerComp
                  selectedDate={startDate}
                  setSelectedDate={setStartDate}
                  onChange={updateStartDate}
                  isLoading={isUpdatingDates}
                />
              </div>

              <div className="p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center mb-3 gap-2">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <p className="text-sm font-medium text-primary">End Date</p>
                </div>
                <DatePickerComp
                  selectedDate={endDate}
                  setSelectedDate={setEndDate}
                  onChange={updateEndDate}
                  isLoading={isUpdatingDates}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-3">Description</h3>
              <div className="space-y-4">
                <RichTextEditor
                  ref={editorRef}
                  initialContent={project.description}
                />
                <Button
                  onClick={updateProjectDescription}
                  variant="outline"
                  className="mt-4 "
                  disabled={isSavingDescription}
                >
                  {isSavingDescription ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <span className="text-blue-400 dark:text-blue-300">
                      Save
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Workflow className="h-5 w-5 mr-2" />
                Assigned Tasks
              </h3>
              <SubtasksTable projectId={project.id} />
            </div>
          </div>
        </CardContent>
      </Card>
      <ChatWidget projectId={project.id} />
    </div>
  );
};

export default ProjectDetails;
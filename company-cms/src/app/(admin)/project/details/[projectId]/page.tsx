"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, DollarSign, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { Triangle } from "react-loader-spinner";

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: "active" | "completed" | "on_hold" | "cancelled";
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

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

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "on_hold":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-project-details/${projectId}`
      );

      if (response.data.success) {
        setProject(response.data.data);
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
          <Link href="/project/manage-project">
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
              <CardDescription>ID: {project.id}</CardDescription>
            </div>
            <Badge
              className={`text-sm px-3 py-1 rounded-full ${getStatusColor(
                project.status
              )}`}
            >
              {project.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    {formatCurrency(project.budget)}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(project.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(project.updatedAt)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-3">Description</h3>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Assigned Team Members
              </h3>
              <div className="bg-muted p-6 rounded-md text-center">
                <p className="text-muted-foreground">
                  No team members assigned yet
                </p>
                <Button className="mt-3" variant="outline">
                  Assign Team Members
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;

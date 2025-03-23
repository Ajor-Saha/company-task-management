"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { MoreHorizontal } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { Triangle } from 'react-loader-spinner'

// Define Project Type
interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

const AllProject: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/project/get-admin-projects`);
      console.log("API Response:", response.data); // Debugging line
  
      if (response.data?.success) {
        setProjects(response.data.data);
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
  }, []);
  

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Function to extract text from HTML and limit words
  const extractPlainText = (html: string, wordLimit: number): string => {
    const text = html.replace(/<[^>]*>/g, ""); // Remove HTML tags
    return text.split(" ").slice(0, wordLimit).join(" ") + "...";
  };

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
        All Projects
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-96">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="relative shadow-lg">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {project.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => console.log("Edit project", project.id)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log("Delete project", project.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {extractPlainText(project.description, 15)}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Budget: ${project.budget}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProject;

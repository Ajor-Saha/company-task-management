"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";
import { TaskBarChart } from "@/components/charts/task-bar-chart";
import axios from "axios";



interface EmployeeStats {
  employee: {
    userId: string;
    name: string;
    role: string;
    avatar: string;
  };
  stats: {
    tasks: {
      total: number;
      todo: number;
      inProgress: number;
      completed: number;
      hold: number;
      review: number;
      completionRate: number;
    };
    projects: {
      total: number;
    };
  };
}


export default function EmployeeDetails() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const [isLoading, setIsLoading] = useState(true);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);

  const fetchEmployeeStats = useCallback(async () => {
    if (!employeeId) return;
    
    setIsLoading(true);
    try {
      const response = await Axios.get(`${env.BACKEND_BASE_URL}/api/employee/get-employee-stats/${employeeId}`);
      console.log("API Response:", response.data);

      if (response.data?.success) {
        setEmployeeStats(response.data.data);
      } else {
        toast.error("Failed to fetch employee statistics");
        console.error("API Error Message:", response.data.message);
      }
    } catch (error) {
      console.error("FetchEmployeeStats Error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Details:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to fetch employee data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployeeStats();
  }, [fetchEmployeeStats]);

  console.log("Employee Stats:", employeeStats);
  

  return (
    <div className="m-4 space-y-6">
      {/* Employee Header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={employeeStats?.employee.avatar || "/asset/avatarPic.jpg"} alt={employeeStats?.employee.name || ""} />
          <AvatarFallback>{employeeStats?.employee.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-24 mt-2" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{employeeStats?.employee.name || "Loading..."}</h1>
              <p className="text-muted-foreground">{employeeStats?.employee.role || "Employee"}</p>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2  xl:grid-cols-4 gap-4">
        {/* Total Tasks Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{employeeStats?.stats.tasks.total || 0}</div>
                  <Badge>{employeeStats?.stats.tasks.inProgress || 0} Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {employeeStats?.stats.tasks.todo || 0} tasks pending
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Projects Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{employeeStats?.stats.projects.total || 0}</div>
                  <Badge variant="secondary">Current</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Actively participating
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Tasks Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">
                    {(employeeStats?.stats.tasks.inProgress || 0) + (employeeStats?.stats.tasks.review || 0)}
                  </div>
                  <Badge variant="outline">In Progress</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {employeeStats?.stats.tasks.review || 0} in review
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Completion Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{employeeStats?.stats.tasks.completionRate || 0}%</div>
                  <Badge 
                    variant="success" 
                    className={
                      (employeeStats?.stats.tasks.completionRate || 0) >= 75 ? "bg-green-500" : 
                      (employeeStats?.stats.tasks.completionRate || 0) >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }
                  >
                    {(employeeStats?.stats.tasks.completionRate || 0) >= 75 ? "High" : 
                     (employeeStats?.stats.tasks.completionRate || 0) >= 50 ? "Medium" : "Low"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {employeeStats?.stats.tasks.completed || 0} tasks completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
         
        
      </div>
      {/* Chart on employee task stats */}
      
      <div className="flex lg:flex-row flex-col gap-4">
        <div className="lg:w-1/2 w-full">
          {employeeStats && (
            <TaskBarChart
              data={{
                todo: employeeStats.stats.tasks.todo,
                inProgress: employeeStats.stats.tasks.inProgress,
                completed: employeeStats.stats.tasks.completed,
                hold: employeeStats.stats.tasks.hold,
                review: employeeStats.stats.tasks.review,
              }}
            />
          )}
        </div>
        <Card className="lg:w-1/2 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-muted-foreground">
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {employeeStats ? (
                  (employeeStats?.stats.tasks.completionRate || 0) > 75 ? (
                    "Excellent performance! High task completion rate with good distribution across projects."
                  ) : (employeeStats?.stats.tasks.completionRate || 0) > 50 ? (
                    "Good progress with steady task completion. Consider focusing on completing in-progress tasks."
                  ) : (
                    "Room for improvement. Consider prioritizing task completion and reducing the number of tasks on hold."
                  )
                ) : (
                  "No performance data available."
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
     
    </div>
  );
}




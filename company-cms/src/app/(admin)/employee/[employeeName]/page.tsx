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
import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
      overdue: number;
      completionRate: number;
    };
    projects: {
      total: number;
    };
  };
}

interface AIAnalysis {
  employeeData: EmployeeStats;
  aiAnalysis: string;
  generatedAt: string;
}

// Add type for markdown components
type MarkdownComponentProps = {
  node?: any;
  children?: React.ReactNode;
  [key: string]: any;
};

export default function EmployeeDetails() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const [isLoading, setIsLoading] = useState(true);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

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

  const requestAIAnalysis = async () => {
    if (!employeeStats) return;
    
    setIsAnalyzing(true);
    try {
      const response = await Axios.post(
        `${env.BACKEND_BASE_URL}/api/employee/analyze-employee-performance`,
        employeeStats
      );

      if (response.data?.success) {
        setAiAnalysis(response.data.data);
      } else {
        toast.error("Failed to analyze performance");
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to analyze performance");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchEmployeeStats();
  }, [fetchEmployeeStats]);

  console.log(employeeStats);
  
  

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
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              Performance Summary
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={requestAIAnalysis}
              disabled={isAnalyzing || !employeeStats}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {/* Basic Performance Summary */}
                  <div>
                    <h3 className="font-semibold mb-2">Quick Overview</h3>
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
                  </div>

                  {/* AI Analysis Section */}
                  {aiAnalysis && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">AI Performance Analysis</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="prose prose-sm dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:mb-2 prose-p:mt-0 max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children, ...props}: MarkdownComponentProps) => (
                                <h1 className="text-lg font-bold" {...props}>{children}</h1>
                              ),
                              h2: ({children, ...props}: MarkdownComponentProps) => (
                                <h2 className="text-base font-semibold" {...props}>{children}</h2>
                              ),
                              h3: ({children, ...props}: MarkdownComponentProps) => (
                                <h3 className="text-sm font-semibold" {...props}>{children}</h3>
                              ),
                              p: ({children, ...props}: MarkdownComponentProps) => (
                                <p className="text-sm text-muted-foreground" {...props}>{children}</p>
                              ),
                              ul: ({children, ...props}: MarkdownComponentProps) => (
                                <ul className="list-disc pl-4 text-sm text-muted-foreground" {...props}>{children}</ul>
                              ),
                              ol: ({children, ...props}: MarkdownComponentProps) => (
                                <ol className="list-decimal pl-4 text-sm text-muted-foreground" {...props}>{children}</ol>
                              ),
                              li: ({children, ...props}: MarkdownComponentProps) => (
                                <li className="mt-1" {...props}>{children}</li>
                              ),
                              strong: ({children, ...props}: MarkdownComponentProps) => (
                                <strong className="font-semibold text-foreground" {...props}>{children}</strong>
                              ),
                              em: ({children, ...props}: MarkdownComponentProps) => (
                                <em className="text-muted-foreground" {...props}>{children}</em>
                              ),
                              blockquote: ({children, ...props}: MarkdownComponentProps) => (
                                <blockquote 
                                  className="border-l-2 border-primary pl-4 italic text-sm text-muted-foreground"
                                  {...props}
                                >
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {aiAnalysis.aiAnalysis}
                          </ReactMarkdown>
                        </div>
                        <p className="text-xs text-muted-foreground italic border-t pt-2">
                          Generated at: {new Date(aiAnalysis.generatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Task Statistics */}
                  {employeeStats && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Task Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Active Tasks</p>
                          <p className="text-2xl font-bold text-primary">
                            {employeeStats.stats.tasks.inProgress}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Overdue Tasks</p>
                          <p className="text-2xl font-bold text-destructive">
                            {employeeStats.stats.tasks.overdue}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Completion Rate</p>
                          <p className="text-2xl font-bold text-green-500">
                            {employeeStats.stats.tasks.completionRate}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Total Projects</p>
                          <p className="text-2xl font-bold text-blue-500">
                            {employeeStats.stats.projects.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
     
    </div>
  );
}




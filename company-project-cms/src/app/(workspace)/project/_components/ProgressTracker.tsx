"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  RefreshCcw, 
  PauseCircle,
  Eye,
  AlertCircle,
  BarChart2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProjectStats {
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    hold: number;
    review: number;
    completionRate: number;
    overDueTasks: number;
  };
}

interface ProgressTrackerProps {
  projectId: string;
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ProgressTracker({ projectId }: ProgressTrackerProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjectStats = useCallback(async () => {
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-project-stats/${projectId}`
      );
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        toast.error("Failed to fetch project statistics");
      }
    } catch (error) {
      console.error("Error fetching project stats:", error);
      toast.error("An error occurred while fetching project statistics");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectStats();

    // Set up an interval to refresh stats every 5 minutes
    const intervalId = setInterval(fetchProjectStats, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchProjectStats]);

  if (loading) {
    return <StatsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  const primaryMetrics = [
    {
      title: "Total Tasks",
      value: stats.tasks.total,
      icon: ListTodo,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Completion Rate",
      value: `${stats.tasks.completionRate}%`,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      showProgress: true,
    },
    {
      title: "In Progress",
      value: stats.tasks.inProgress,
      icon: RefreshCcw,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Overdue Tasks",
      value: stats.tasks.overDueTasks,
      icon: Clock,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  const secondaryMetrics = [
    {
      title: "To Do",
      value: stats.tasks.todo,
      icon: AlertCircle,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "In Review",
      value: stats.tasks.review,
      icon: Eye,
      color: "text-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      title: "On Hold",
      value: stats.tasks.hold,
      icon: PauseCircle,
      color: "text-gray-500",
      bgColor: "bg-gray-100 dark:bg-gray-900/20",
    },
    {
      title: "Task Distribution",
      value: `${stats.tasks.completed}/${stats.tasks.total}`,
      icon: BarChart2,
      color: "text-indigo-500",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
  ];

  const renderMetricCard = (metric: any, index: number) => {
    const Icon = metric.icon;
    return (
      <Card key={index} className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-lg ${metric.bgColor} ${metric.color}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <h3 className="text-2xl font-bold">{metric.value}</h3>
              {metric.showProgress && (
                <div className="mt-2">
                  <Progress 
                    value={stats.tasks.completionRate} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryMetrics.map((metric, index) => renderMetricCard(metric, index))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryMetrics.map((metric, index) => renderMetricCard(metric, index))}
      </div>
    </div>
  );
}

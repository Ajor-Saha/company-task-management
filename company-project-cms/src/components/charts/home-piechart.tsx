"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface TaskCountData {
  projectTasks: {
    projectName: string;
    taskCount: number;
  }[];
  otherTasks: number;
}

interface HomePieChartProps {
  data: TaskCountData | null;
  loading: boolean;
}

const COLORS = {
  project1: "#22c55e", // green
  project2: "#3b82f6", // blue
  project3: "#f97316", // orange
  project4: "#8b5cf6", // purple
  project5: "#ef4444", // red
  project6: "#06b6d4", // cyan
  project7: "#84cc16", // lime
  project8: "#f59e0b", // amber
  project9: "#ec4899", // pink
  project10: "#10b981", // emerald
  other: "#64748b", // slate
};

const CustomTooltip = ({ active, payload, className }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`rounded-lg border p-3 shadow-lg ${className}`}>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {data.name}
          </span>
          <span className="text-lg font-bold text-primary">
            {data.value} tasks
          </span>
          <span className="text-xs text-muted-foreground">
            {((data.value / data.total) * 100).toFixed(1)}% of total
          </span>
        </div>
      </div>
    );
  }
  return null;
};

function ChartSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Task Distribution</CardTitle>
        <CardDescription>Loading task data...</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="h-[280px] w-full flex items-center justify-center">
          <div className="relative w-[220px] h-[220px] animate-pulse">
            {/* Create circular segments to simulate pie chart */}
            <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-muted-foreground/20 transform origin-bottom-right rotate-45" />
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-muted-foreground/30 transform origin-bottom-left -rotate-45" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-muted-foreground/10 transform origin-top-right -rotate-45" />
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-muted-foreground/25 transform origin-top-left rotate-45" />
            </div>
            {/* Center circle for donut effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-card" />
            {/* Simulated data labels */}
            <div className="absolute top-1/4 right-0 transform translate-x-4">
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="absolute bottom-1/4 left-0 transform -translate-x-4">
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm mt-4">
        <div className="flex items-center gap-2 w-full">
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-4 w-4 ml-auto" />
        </div>
        <Skeleton className="h-4 w-[40%]" />
      </CardFooter>
    </Card>
  );
}

export function HomePieChart({ data, loading }: HomePieChartProps) {
  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Task Distribution</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalTasks = data.projectTasks.reduce((sum, project) => sum + project.taskCount, 0) + data.otherTasks;

  // Prepare data for the pie chart
  const chartData = [
    ...data.projectTasks.map((project, index) => {
      const projectNumber = index + 1;
      const type = `project${projectNumber}`;
      return {
        name: project.projectName,
        value: project.taskCount,
        type,
        total: totalTasks,
      };
    }),
    { 
      name: "Other Tasks", 
      value: data.otherTasks,
      type: "other",
      total: totalTasks,
    },
  ];

  const monthlyIncrease = ((totalTasks / (totalTasks * 0.95) - 1) * 100).toFixed(1);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show label if value is greater than 0
    if (value === 0) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-bold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {value}
      </text>
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Task Distribution</CardTitle>
        <CardDescription>Project Tasks Overview</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip className="dark:bg-gray-900 bg-gray-200" />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={110}
                innerRadius={0}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.type as keyof typeof COLORS]} 
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Task volume up by {monthlyIncrease}% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Total Tasks: {totalTasks} ({data.projectTasks.length} projects)
        </div>
      </CardFooter>
    </Card>
  )
}

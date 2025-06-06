"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
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
import { MetricCard } from "@/app/(admin)/dashboard/_components/metric-card";
import PStatisticsGraph from "@/app/(admin)/dashboard/_components/PStatisticsGraph";
import { softwareProducts } from "./_components/data";
import { ChartAreaInteractive } from "@/components/charts/area-duble-chart";
import { ProjectTable } from "./_components/project-table";
import { EmployeeTable } from "./_components/employee-table";
import { HomePieChart } from "@/components/charts/home-piechart";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ChartLineDots } from "@/components/charts/line-chart";

interface DashboardMetrics {
  totalProjects: {
    value: number;
    change: number;
    trend: "up" | "down";
  };
  totalEmployees: {
    value: number;
    change: number;
    trend: "up" | "down";
  };
  totalSales: {
    value: number;
    change: number;
    trend: "up" | "down";
  };
  grossProfit: {
    value: number;
    change: number;
    trend: "up" | "down";
  };
}

interface ChartDataPoint {
  date: string;
  totalProjects: number;
  completedProjects: number;
}

interface ChartData {
  timeframe: string;
  startDate: string;
  endDate: string;
  chartData: ChartDataPoint[];
}

export default function DashboardClient() {
  const [timeframe, setTimeframe] = useState("last-year");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/company/get-dashboard-metrics?timeframe=${timeframe}`
      );

      if (response.data.success) {
        setMetrics(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch dashboard metrics");
      }
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  const fetchChartData = useCallback(async () => {
    setIsChartLoading(true);
    try {
      // Map timeframe values to API format
      const timeframeMap: { [key: string]: string } = {
        "last-3-month": "3months",
        "last-6-month": "6months",
        "last-year": "1year",
        "all-time": "1year", // fallback to 1year for all-time
      };

      const apiTimeframe = timeframeMap[timeframe] || "3months";

      const response = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/project/get-project-chart-data/${apiTimeframe}`
      );

      if (response.data.success) {
        setChartData(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch chart data");
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast.error("Failed to fetch chart data");
    } finally {
      setIsChartLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchChartData();
  }, [fetchDashboardMetrics, fetchChartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const dashboardMetrics = metrics ? [
    {
      title: "Total Projects",
      value: metrics.totalProjects.value.toString(),
      change: metrics.totalProjects.change,
      changeValue: `${metrics.totalProjects.change >= 0 ? '+' : ''}${metrics.totalProjects.value - (metrics.totalProjects.value / (1 + metrics.totalProjects.change / 100))}`,
      changeLabel: "this period",
      trend: metrics.totalProjects.trend,
      icon: "🛠️",
    },
    {
      title: "Total Employees",
      value: metrics.totalEmployees.value.toString(),
      change: metrics.totalEmployees.change,
      changeValue: `${metrics.totalEmployees.change >= 0 ? '+' : ''}${metrics.totalEmployees.value - (metrics.totalEmployees.value / (1 + metrics.totalEmployees.change / 100))}`,
      changeLabel: "this period",
      trend: metrics.totalEmployees.trend,
      icon: "👨",
    },
    {
      title: "Total Sales",
      value: formatCurrency(metrics.totalSales.value),
      change: metrics.totalSales.change,
      changeValue: formatCurrency(metrics.totalSales.value - (metrics.totalSales.value / (1 + metrics.totalSales.change / 100))),
      changeLabel: "this period",
      trend: metrics.totalSales.trend,
      icon: "💰",
    },
    {
      title: "Gross Profit",
      value: formatCurrency(metrics.grossProfit.value),
      change: metrics.grossProfit.change,
      changeValue: formatCurrency(metrics.grossProfit.value - (metrics.grossProfit.value / (1 + metrics.grossProfit.change / 100))),
      changeLabel: "this period",
      trend: metrics.grossProfit.trend,
      icon: "💵",
    },
  ] : [];

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-6">
          {/* Greeting and Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Good day, Visionary Leader!
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your projects today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Timeframe</SelectLabel>
                    <SelectItem value="last-year">Last year</SelectItem>
                    <SelectItem value="last-6-month">Last 6 month</SelectItem>
                    <SelectItem value="last-3-month">Last 3 month</SelectItem>
                    <SelectItem value="all-time">All time</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                    Export
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              dashboardMetrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))
            )}
          </div>

          {/* Charts Row */}
          <div className="">
            <ChartAreaInteractive 
              data={chartData} 
              isLoading={isChartLoading}
              timeframe={timeframe}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartLineDots />
            <HomePieChart />
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Recent Projects</h3>
                <ProjectTable />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Recent Employees</h3>
                <EmployeeTable />
              </CardContent>
            </Card>
          </div>
          
        </div>
      </main>
    </div>
  );
}

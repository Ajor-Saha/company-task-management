"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MetricCard } from "@/app/(admin)/dashboard/_components/metric-card";
import { ChartAreaInteractive } from "@/components/charts/area-duble-chart";
import { ProjectTable } from "./_components/project-table";
import { EmployeeTable } from "./_components/employee-table";
import { HomePieChart } from "@/components/charts/home-piechart";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ChartLineDots } from "@/components/charts/line-chart";
import exportToPDF from 'jspdf-html2canvas';

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
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

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

  const exportToPDFHandler = async () => {
    if (!metrics) {
      toast.error("No data available to export");
      return;
    }

    setIsExporting(true);
    try {
      // Create a simple HTML structure for the PDF
      const reportContent = document.createElement('div');
      reportContent.style.cssText = `
        font-family: Arial, sans-serif;
        padding: 40px;
        background: white;
        color: black;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
      `;

      // Generate the HTML content
      reportContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">TaskForge Dashboard Report</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px; color: #666;">Timeframe: ${timeframe.replace('-', ' ').toUpperCase()}</p>
        </div>

        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 22px; margin-bottom: 20px; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Dashboard Metrics</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Metric</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Value</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Change</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">Total Projects</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${metrics.totalProjects.value}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${metrics.totalProjects.change >= 0 ? '+' : ''}${metrics.totalProjects.change}%</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${metrics.totalProjects.trend === 'up' ? '↑' : '↓'}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="border: 1px solid #ddd; padding: 12px;">Total Employees</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${metrics.totalEmployees.value}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${metrics.totalEmployees.change >= 0 ? '+' : ''}${metrics.totalEmployees.change}%</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${metrics.totalEmployees.trend === 'up' ? '↑' : '↓'}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">Total Sales</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${metrics.totalSales.value.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${metrics.totalSales.change >= 0 ? '+' : ''}${metrics.totalSales.change}%</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${metrics.totalSales.trend === 'up' ? '↑' : '↓'}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="border: 1px solid #ddd; padding: 12px;">Gross Profit</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${metrics.grossProfit.value.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${metrics.grossProfit.change >= 0 ? '+' : ''}${metrics.grossProfit.change}%</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${metrics.grossProfit.trend === 'up' ? '↑' : '↓'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${chartData && chartData.chartData && chartData.chartData.length > 0 ? `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 22px; margin-bottom: 20px; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Project Chart Data</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Date</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Total Projects</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Completed Projects</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              ${chartData.chartData.map((item, index) => `
                <tr ${index % 2 === 1 ? 'style="background-color: #f9f9f9;"' : ''}>
                  <td style="border: 1px solid #ddd; padding: 12px;">${new Date(item.date).toLocaleDateString()}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${item.totalProjects}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${item.completedProjects}</td>
                  <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${item.totalProjects > 0 ? Math.round((item.completedProjects / item.totalProjects) * 100) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
          <h2 style="font-size: 22px; margin-bottom: 20px; color: #000;">Summary</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #000;">
            <p style="margin: 0 0 10px 0;"><strong>Report Period:</strong> ${timeframe.replace('-', ' ').toUpperCase()}</p>
            <p style="margin: 0 0 10px 0;"><strong>Total Active Projects:</strong> ${metrics.totalProjects.value}</p>
            <p style="margin: 0 0 10px 0;"><strong>Total Team Members:</strong> ${metrics.totalEmployees.value}</p>
            <p style="margin: 0 0 10px 0;"><strong>Revenue Generated:</strong> $${metrics.totalSales.value.toLocaleString()}</p>
            <p style="margin: 0;"><strong>Profit Margin:</strong> $${metrics.grossProfit.value.toLocaleString()}</p>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>This report was automatically generated by TaskForge Dashboard System</p>
          <p>© ${new Date().getFullYear()} TaskForge. All rights reserved.</p>
        </div>
      `;

      // Add the content to the document temporarily
      reportContent.style.position = 'absolute';
      reportContent.style.left = '-9999px';
      reportContent.style.top = '0';
      document.body.appendChild(reportContent);

      const options = {
        jsPDF: {
          format: 'a4',
          orientation: 'portrait' as const,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 800,
          height: reportContent.scrollHeight,
        },
        output: `TaskForge-Dashboard-Report-${new Date().toISOString().split('T')[0]}.pdf`
      };

      await exportToPDF(reportContent, options);
      
      // Clean up
      document.body.removeChild(reportContent);
      
      toast.success("PDF report exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!metrics || !chartData) {
      toast.error("No data available to export");
      return;
    }

    try {
      // Create CSV content
      let csvContent = "TaskForge Dashboard Report\n";
      csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
      csvContent += `Timeframe: ${timeframe}\n\n`;
      
      // Add metrics data
      csvContent += "Dashboard Metrics\n";
      csvContent += "Metric,Value,Change,Trend\n";
      csvContent += `Total Projects,${metrics.totalProjects.value},${metrics.totalProjects.change}%,${metrics.totalProjects.trend}\n`;
      csvContent += `Total Employees,${metrics.totalEmployees.value},${metrics.totalEmployees.change}%,${metrics.totalEmployees.trend}\n`;
      csvContent += `Total Sales,$${metrics.totalSales.value.toLocaleString()},${metrics.totalSales.change}%,${metrics.totalSales.trend}\n`;
      csvContent += `Gross Profit,$${metrics.grossProfit.value.toLocaleString()},${metrics.grossProfit.change}%,${metrics.grossProfit.trend}\n\n`;
      
      // Add chart data
      if (chartData.chartData && chartData.chartData.length > 0) {
        csvContent += "Project Chart Data\n";
        csvContent += "Date,Total Projects,Completed Projects\n";
        chartData.chartData.forEach(item => {
          csvContent += `${item.date},${item.totalProjects},${item.completedProjects}\n`;
        });
      }

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `TaskForge-Dashboard-Data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

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
      <main className="flex-1 p-4 sm:p-6 md:p-8" ref={dashboardRef}>
        <div className="flex flex-col gap-6">
          {/* Dashboard Header for PDF */}
          <div className="hidden print:block mb-6">
            <h1 className="text-3xl font-bold text-center mb-2">TaskForge Dashboard Report</h1>
            <p className="text-center text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
            <p className="text-center text-gray-600">Timeframe: {timeframe}</p>
          </div>

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
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        Export
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDFHandler} disabled={isExporting}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </Card>
                ))}
              </>
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

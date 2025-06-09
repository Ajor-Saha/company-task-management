"use client";

import { MoreHorizontal } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import { ColorRing } from "react-loader-spinner";

// Types
interface EmployeeStats {
  employeeName: string;
  totalTasks: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface StatsResponse {
  success: boolean;
  message: string;
  data: {
    employees: EmployeeStats[];
    summary: {
      totalEmployees: number;
      totalTasks: number;
      totalOverdue: number;
    };
  };
}

// Helper functions
function getStatusBadgeVariant(status: string, count: number) {
  if (count === 0) return "outline";
  
  switch (status) {
    case "todo":
      return "secondary";
    case "inProgress":
      return "default";
    case "completed":
      return "success";
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
}

export default function EmployeePerformance() {
  // State for performance data - no pagination
  const [stats, setStats] = useState<EmployeeStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtered stats
  const filteredStats = stats.filter((stat) => {
    // Filter by search query (employee name)
    if (searchQuery && !stat.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by status
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "todo":
          return stat.todo > 0;
        case "inProgress":
          return stat.inProgress > 0;
        case "completed":
          return stat.completed > 0;
        case "overdue":
          return stat.overdue > 0;
        default:
          return true;
      }
    }

    return true;
  });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await Axios.get<StatsResponse>(
        `${env.BACKEND_BASE_URL}/api/task/employee-tasks-stats`
      );

      if (response.data.success) {
        setStats(response.data.data.employees);
      } else {
        toast.error("Failed to fetch performance data");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("An error occurred while fetching performance data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Employee Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Status Filter UI */}
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          <div className="flex w-full md:w-auto items-center gap-2">
            <Input
              placeholder="Search by employee name..."
              className="max-w-sm"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To-Do</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={fetchStats}>
            Refresh Data
          </Button>
        </div>

        {/* Stats Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead className="text-center">Total Tasks</TableHead>
                <TableHead className="text-center">To-Do</TableHead>
                <TableHead className="text-center">In Progress</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Overdue</TableHead>
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
              ) : filteredStats.length > 0 ? (
                filteredStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{stat.employeeName}</div>
                    </TableCell>
                    <TableCell className="text-center">{stat.totalTasks}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant("todo", stat.todo)}>
                        {stat.todo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant("inProgress", stat.inProgress)}>
                        {stat.inProgress}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant("completed", stat.completed)}>
                        {stat.completed}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant("overdue", stat.overdue)}>
                        {stat.overdue}
                      </Badge>
                    </TableCell>
                    {/* <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Export Data</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell> */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No performance data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Simple footer without pagination */}
        <div className="flex justify-between items-center space-x-2 py-6">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{filteredStats.length}</span> of{" "}
            <span className="font-medium">{stats.length}</span> employees
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

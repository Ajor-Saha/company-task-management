import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { companyTable } from "../db/schema/tbl-company";
import { eq } from "drizzle-orm";
import { projectTable } from "../db/schema/tbl-project";
import { userTable } from "../db/schema/tbl-user";
import { sql } from "drizzle-orm";
import { taskTable } from "../db/schema/tbl-task";

export const createCompany = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { name, category, address } = req.body;

      // Validate required fields
      if (
        [name, category].some((field) => !field || field.trim() === "")
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, "Name, category are required")
          );
      }

      // Check if a company with the same name already exists
      const existingCompany = await db
        .select()
        .from(companyTable)
        .where(eq(companyTable.name, name)); // Assuming 'name' should be unique

      if (existingCompany.length > 0) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, "Company with this name already exists")
          );
      }

      // Insert new company
      const newCompany = {
        id: uuidv4(),
        name,
        category,
        address,
        createdAt: new Date(),
      };

      const [createdCompany] = await db
        .insert(companyTable)
        .values(newCompany)
        .returning();

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
             createdCompany,
            "Company created successfully"
          )
        );
    } catch (error) {
      console.error("Error creating company:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getCompanyDetails = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get company ID from request params or from authenticated user
      const companyId = req.user?.companyId;

      // Fetch company details from the database
      const company = await db
        .select()
        .from(companyTable)
        .where(eq(companyTable.id, companyId))
        .limit(1);

      if (company.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Company not found"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            company[0],
            "Company details retrieved successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching company details:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const updateCompanyDetails = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company ID not found"));
      }

      // Get update data from request body
      const { name, category, description, address } = req.body;

      // Validate required fields
      if ([name, category].some((field) => !field || field.trim() === "")) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Company name and category are required"));
      }

      // Check if company exists
      const existingCompany = await db
        .select()
        .from(companyTable)
        .where(eq(companyTable.id, companyId))
        .limit(1);

      if (existingCompany.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Company not found"));
      }

      // Update company in database
      const [updatedCompany] = await db
        .update(companyTable)
        .set({
          name,
          category,
          description,
          address,
          updatedAt: new Date(),
        })
        .where(eq(companyTable.id, companyId))
        .returning();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedCompany,
            "Company updated successfully"
          )
        );
    } catch (error) {
      console.error("Error updating company:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getDashboardMetrics = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const timeframe = req.query.timeframe as string || 'all-time';

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company ID not found"));
      }

      // Calculate date range based on timeframe
      const currentDate = new Date();
      let startDate = new Date(0); // Default to earliest possible date

      switch (timeframe) {
        case 'last-year':
          startDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
          break;
        case 'last-6-month':
          startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 6));
          break;
        case 'last-3-month':
          startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 3));
          break;
        // 'all-time' will use the default startDate
      }

      // Get total projects in timeframe
      const projects = await db
        .select({
          id: projectTable.id,
          budget: projectTable.budget,
          extraCost: projectTable.extraCost,
        })
        .from(projectTable)
        .where(sql`${projectTable.companyId} = ${companyId} AND ${projectTable.createdAt} >= ${startDate}`);

      const totalProjects = projects.length;

      // Calculate total sales (sum of project budgets)
      const totalSales = projects.reduce((sum, project) => sum + (project.budget || 0), 0);

      // Get employees in timeframe
      const employees = await db
        .select({
          userId: userTable.userId,
          salary: userTable.salary,
        })
        .from(userTable)
        .where(sql`${userTable.companyId} = ${companyId} AND ${userTable.createdAt} >= ${startDate}`);

      const totalEmployees = employees.length;

      // Calculate total employee costs
      const totalEmployeeCosts = employees.reduce((sum, employee) => sum + (parseInt(employee.salary || '0')), 0);

      // Calculate extra costs
      const totalExtraCosts = projects.reduce((sum, project) => sum + (project.extraCost || 0), 0);

      // Calculate gross profit
      const grossProfit = totalSales - totalExtraCosts - totalEmployeeCosts;

      // Get previous period metrics for comparison
      const previousStartDate = new Date(startDate);
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);

      const previousProjects = await db
        .select({
          id: projectTable.id,
          budget: projectTable.budget,
        })
        .from(projectTable)
        .where(sql`${projectTable.companyId} = ${companyId} AND ${projectTable.createdAt} >= ${previousStartDate} AND ${projectTable.createdAt} < ${startDate}`);

      // Calculate percentage changes
      const previousTotalProjects = previousProjects.length;
      const projectChange = previousTotalProjects ? ((totalProjects - previousTotalProjects) / previousTotalProjects) * 100 : 0;

      const previousTotalSales = previousProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
      const salesChange = previousTotalSales ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0;

      const metrics = {
        totalProjects: {
          value: totalProjects,
          change: projectChange,
          trend: projectChange >= 0 ? "up" : "down"
        },
        totalEmployees: {
          value: totalEmployees,
          change: 0, // You might want to calculate this similarly
          trend: "up"
        },
        totalSales: {
          value: totalSales,
          change: salesChange,
          trend: salesChange >= 0 ? "up" : "down"
        },
        grossProfit: {
          value: grossProfit,
          change: 0, // You might want to calculate this similarly
          trend: grossProfit >= 0 ? "up" : "down"
        }
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            metrics,
            "Dashboard metrics retrieved successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getRecentEmployees = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company ID not found"));
      }

      // Fetch recent employees from the database
      const recentEmployees = await db
        .select({
          id: userTable.userId,
          name: sql<string>`concat(${userTable.firstName}, ' ', COALESCE(${userTable.lastName}, ''))`,
          email: userTable.email,
          role: userTable.role,
          avatar: userTable.avatar,
        })
        .from(userTable)
        .where(eq(userTable.companyId, companyId))
        .orderBy(sql`${userTable.createdAt} DESC`)
        .limit(5);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            recentEmployees,
            "Recent employees retrieved successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching recent employees:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getMonthlySalesData = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company ID not found"));
      }

      // Calculate date range for last 6 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      // Fetch projects within the date range
      const projects = await db
        .select({
          startDate: projectTable.startDate,
          budget: projectTable.budget,
        })
        .from(projectTable)
        .where(sql`${projectTable.companyId} = ${companyId} 
          AND ${projectTable.startDate} >= ${startDate}
          AND ${projectTable.startDate} <= ${endDate}`);

      // Create a map for monthly sales
      const monthlySales = new Map();
      
      // Initialize all months with 0
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthlySales.set(monthKey, 0);
      }

      // Calculate sales for each month
      projects.forEach(project => {
        if (project.startDate && project.budget) {
          const monthKey = project.startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
          const currentAmount = monthlySales.get(monthKey) || 0;
          monthlySales.set(monthKey, currentAmount + project.budget);
        }
      });

      // Convert map to array and sort by date
      const chartData = Array.from(monthlySales.entries())
        .map(([month, amount]) => ({
          month,
          amount
        }))
        .reverse(); // Most recent month first

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              data: chartData,
              totalSales: chartData.reduce((sum, item) => sum + item.amount, 0),
              averageMonthlySales: chartData.reduce((sum, item) => sum + item.amount, 0) / chartData.length
            },
            "Monthly sales data retrieved successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching monthly sales data:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getProjectTaskStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company ID not found"));
      }

      // First verify if the project belongs to the company
      const project = await db
        .select()
        .from(projectTable)
        .where(sql`${projectTable.id} = ${projectId} AND ${projectTable.companyId} = ${companyId}`)
        .limit(1);

      if (project.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Project not found or unauthorized"));
      }

      // Get task counts by status
      const taskStats = await db
        .select({
          status: taskTable.status,
          count: sql<number>`count(*)::int`,
        })
        .from(taskTable)
        .where(eq(taskTable.projectId, projectId))
        .groupBy(taskTable.status);

      // Initialize counts for all statuses
      const stats = {
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        holdTasks: 0,
        reviewTasks: 0,
      };

      // Map the results to our stats object
      taskStats.forEach((stat) => {
        switch (stat.status) {
          case "completed":
            stats.completedTasks = stat.count;
            break;
          case "in-progress":
            stats.inProgressTasks = stat.count;
            break;
          case "to-do":
            stats.todoTasks = stat.count;
            break;
          case "hold":
            stats.holdTasks = stat.count;
            break;
          case "review":
            stats.reviewTasks = stat.count;
            break;
        }
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            stats,
            "Project task statistics retrieved successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching project task statistics:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getAdminProjects = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company ID not found"));
      }

      // Fetch all projects for the company
      const projects = await db
        .select({
          id: projectTable.id,
          name: projectTable.name,
          status: projectTable.status,
        })
        .from(projectTable)
        .where(eq(projectTable.companyId, companyId))
        .orderBy(projectTable.createdAt);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            projects,
            "Projects retrieved successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);


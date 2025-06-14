import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { projectTable } from "../db/schema/tbl-project";
import { and, eq, count, sql, isNotNull, isNull, inArray } from "drizzle-orm";
import { projectAssignmentsTable, userTable, taskTable } from "../db/schema";

export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get companyId from the authenticated user
      const companyId = req.user?.companyId;
      const isAdmin = req.user?.role === "admin";
      if (!companyId || !isAdmin) {
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              {},
              "Unauthorized: Company not found or you are not an admin"
            )
          );
      }

      // Get project details from the request body
      const { name, description, budget } = req.body;

      // Validate required fields
      if (
        !name ||
        name.trim() === "" ||
        !description ||
        description.trim() === "" ||
        !budget ||
        isNaN(Number(budget))
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Project name, description, budget  is required"
            )
          );
      }

      // Prepare the new project object
      const newProject = {
        id: uuidv4(),
        name,
        description, // HTML format from rich text editor
        budget: budget ? Number(budget) : null,
        companyId,
      };

      // Insert new project into the database
      const [createdProject] = await db
        .insert(projectTable)
        .values(newProject)
        .returning();

      return res
        .status(201)
        .json(
          new ApiResponse(201, createdProject, "Project created successfully")
        );
    } catch (error) {
      console.error("Error creating project:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getCompanyProjects = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get companyId from authenticated user's data
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // First get the task counts for all projects
      const taskCounts = await db
        .select({
          projectId: taskTable.projectId,
          count: sql<number>`count(*)::integer`,
        })
        .from(taskTable)
        .groupBy(taskTable.projectId);

      // Get employee counts for all projects
      const employeeCounts = await db
        .select({
          projectId: projectAssignmentsTable.projectId,
          count: sql<number>`count(*)::integer`,
        })
        .from(projectAssignmentsTable)
        .groupBy(projectAssignmentsTable.projectId);

      // Create lookup maps for counts
      const taskCountMap = new Map(
        taskCounts.map(({ projectId, count }) => [projectId, count])
      );
      const employeeCountMap = new Map(
        employeeCounts.map(({ projectId, count }) => [projectId, count])
      );

      // Query the project table for projects that belong to the company
      const projects = await db
        .select({
          id: projectTable.id,
          name: projectTable.name,
          description: projectTable.description,
          budget: projectTable.budget,
          status: projectTable.status,
          companyId: projectTable.companyId,
          createdAt: projectTable.createdAt,
          updatedAt: projectTable.updatedAt,
          startDate: projectTable.startDate,
          endDate: projectTable.endDate,
        })
        .from(projectTable)
        .where(eq(projectTable.companyId, companyId));

      // Combine the data
      const companyProjects = projects.map(project => ({
        ...project,
        taskCount: taskCountMap.get(project.id) || 0,
        assignedEmployeeCount: employeeCountMap.get(project.id) || 0,
      }));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            companyProjects,
            "Company projects fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching company projects:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getProjectDetails = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get project ID from request parameters
      const { projectId } = req.params;
      
      // Get companyId from authenticated user for authorization
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Validate project ID format
      if (!projectId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project ID is required"));
      }

      // Query the project table for the specific project
      const project = await db
        .select({
          id: projectTable.id,
          name: projectTable.name,
          description: projectTable.description,
          budget: projectTable.budget,
          status: projectTable.status,
          companyId: projectTable.companyId,
          createdAt: projectTable.createdAt,
          updatedAt: projectTable.updatedAt,
          startDate: projectTable.startDate,
          endDate: projectTable.endDate,
        })
        .from(projectTable)
        .where(
          and(
            eq(projectTable.id, projectId),
            eq(projectTable.companyId, companyId)
          )
        )
        .limit(1);

      // Check if project exists and belongs to the company
      if (project.length === 0) {
        return res
          .status(404)
          .json(
            new ApiResponse(404, {}, "Project not found or unauthorized access")
          );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            project[0],
            "Project details fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching project details:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      const { projectId } = req.params;
      if (!projectId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project ID is required"));
      }

      // Extract fields to update from the request body
      const { name, budget, startDate, endDate } = req.body;
      if (!name && budget === undefined && startDate === undefined && endDate === undefined) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "At least one field (name, budget, startDate, or endDate) must be provided for update"
            )
          );
      }

      // Build update values object with only provided fields
      const updateValues: {
        name?: string;
        budget?: number;
        startDate?: Date | null;
        endDate?: Date | null;
      } = {};
      if (name) updateValues.name = name;
      if (budget !== undefined) updateValues.budget = Number(budget);
      if (startDate !== undefined) {
        updateValues.startDate = startDate ? new Date(startDate) : null;
      }
      if (endDate !== undefined) {
        updateValues.endDate = endDate ? new Date(endDate) : null;
      }

      // Update the project where the project id and company id match
      const [updatedProject] = await db
        .update(projectTable)
        .set(updateValues)
        .where(
          and(
            eq(projectTable.id, projectId),
            eq(projectTable.companyId, companyId)
          )
        )
        .returning();

      if (!updatedProject) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              "Project not found or you are not authorized to update it"
            )
          );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedProject, "Project updated successfully")
        );
    } catch (error) {
      console.error("Error updating project:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const deleteProject = asyncHandler(
    async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId; // Assuming req.user is populated from middleware

    if (!projectId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project ID is required"));
    }

    // Find the project first
    const project = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.id, projectId));

    if (!project.length) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Project not found"));
    }

    // Ensure the project belongs to the user's company before deleting
    if (project[0].companyId !== companyId || req.user.role !== "admin") {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              {},
              "You are not authorized to delete this project"
            )
          );
    }

    // Delete the project
    await db.delete(projectTable).where(eq(projectTable.id, projectId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project deleted successfully"));
  } catch (error) {
    console.error("Error deleting project:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getProjectAssignments = asyncHandler(
  async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId;

    // Ensure the project ID is provided
    if (!projectId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Project ID is required"));
    }

    // Get the project assignments
    const assignments = await db
      .select({
        id: projectAssignmentsTable.id,
        projectId: projectAssignmentsTable.projectId,
        userId: projectAssignmentsTable.userId,
      })
      .from(projectAssignmentsTable)
      .where(eq(projectAssignmentsTable.projectId, projectId));

    return res
      .status(200)
      .json(
          new ApiResponse(
            200,
            assignments,
            "Project assignments fetched successfully"
          )
      );
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
  }
);

export const assignEmployeeToProject = asyncHandler(
  async (req: Request, res: Response) => {
  try {
    const { projectId, employeeId } = req.query;
    const companyId = req.user.companyId;

    // Ensure required query parameters are provided
    if (!projectId || !employeeId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Missing required query parameters"));
    }

    // Convert query parameters to strings
      const projectIdStr = String(
        Array.isArray(projectId) ? projectId[0] : projectId
      );
      const employeeIdStr = String(
        Array.isArray(employeeId) ? employeeId[0] : employeeId
      );

    // Ensure the user is an admin or senior employee
    if (req.user.role !== "admin" && req.user.role !== "senior_employee") {
        return res
          .status(403)
          .json(
        new ApiResponse(
          403,
          {},
          "Forbidden: Only admins & senior employees can assign employees"
        )
      );
    }

    // Check if the project exists and belongs to the provided company
    const project = await db
      .select()
      .from(projectTable)
        .where(
          and(
        eq(projectTable.id, projectIdStr),
        eq(projectTable.companyId, companyId as string)
          )
        )
      .limit(1);

    if (!project.length) {
        return res
          .status(404)
          .json(
        new ApiResponse(
          404,
          {},
          "Project not found or does not belong to the company"
        )
      );
    }

    // Check if the employee exists and belongs to the same company
    const employee = await db
      .select({ companyId: userTable.companyId })
      .from(userTable)
      .where(
        and(
          eq(userTable.userId, employeeIdStr),
          eq(userTable.companyId, companyId as string)
        )
      )
      .limit(1);

    if (!employee.length) {
        return res
          .status(404)
          .json(
        new ApiResponse(
          404,
          {},
          "Employee not found or does not belong to the company"
        )
      );
    }

    // Check if the employee is already assigned to the project
    const existingAssignment = await db
      .select({ id: projectAssignmentsTable.id })
      .from(projectAssignmentsTable)
      .where(
        and(
          eq(projectAssignmentsTable.projectId, projectIdStr),
          eq(projectAssignmentsTable.userId, employeeIdStr)
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Employee is already assigned to this project"
            )
      );
    }

    // Assign the employee to the project
    await db.insert(projectAssignmentsTable).values({
      id: uuidv4(),
      projectId: projectIdStr,
      userId: employeeIdStr,
    });

    return res
      .status(201)
        .json(
          new ApiResponse(201, {}, "Employee assigned to project successfully")
        );
  } catch (error) {
    console.error("Error assigning employee to project:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
  }
);

export const removeEmployeeFromProject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId, employeeId } = req.query;
      const companyId = req.user.companyId;

      // Ensure required query parameters are provided
      if (!projectId || !employeeId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Missing required query parameters"));
      }

      // Convert query parameters to strings
      const projectIdStr = String(
        Array.isArray(projectId) ? projectId[0] : projectId
      );
      const employeeIdStr = String(
        Array.isArray(employeeId) ? employeeId[0] : employeeId
      );

      // Ensure the user is an admin or senior employee
      if (req.user.role !== "admin" && req.user.role !== "senior_employee") {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              {},
              "Forbidden: Only admins & senior employees can remove employees"
            )
          );
      }

      // Check if the project exists and belongs to the provided company
      const project = await db
        .select()
        .from(projectTable)
        .where(
          and(
            eq(projectTable.id, projectIdStr),
            eq(projectTable.companyId, companyId as string)
          )
        )
        .limit(1);

      if (!project.length) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              "Project not found or does not belong to the company"
            )
          );
      }

      // Check if the employee exists and belongs to the same company
      const employee = await db
        .select({ companyId: userTable.companyId })
        .from(userTable)
        .where(
          and(
            eq(userTable.userId, employeeIdStr),
            eq(userTable.companyId, companyId as string)
          )
        )
        .limit(1);

      if (!employee.length) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              "Employee not found or does not belong to the company"
            )
          );
      }

      // Check if the employee is assigned to the project
      const existingAssignment = await db
        .select({ id: projectAssignmentsTable.id })
        .from(projectAssignmentsTable)
        .where(
          and(
            eq(projectAssignmentsTable.projectId, projectIdStr),
            eq(projectAssignmentsTable.userId, employeeIdStr)
          )
        )
        .limit(1);

      if (existingAssignment.length === 0) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, "Employee is not assigned to this project")
          );
      }

      // Remove the employee from the project
      await db
        .delete(projectAssignmentsTable)
        .where(
          and(
            eq(projectAssignmentsTable.projectId, projectIdStr),
            eq(projectAssignmentsTable.userId, employeeIdStr)
          )
        );

      return res
        .status(200)
        .json(
          new ApiResponse(200, {}, "Employee removed from project successfully")
        );
    } catch (error) {
      console.error("Error removing employee from project:", error);
      res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const updateProjectStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { status } = req.body;
      const companyId = req.user?.companyId;

      // Validate required fields
      if (!projectId || !status) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project ID and status are required"));
      }

      // Validate status value against enum
      const validStatuses = [
        "to-do",
        "in-progress",
        "review",
        "completed",
        "hold",
      ];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Invalid status value"));
      }

      // Update the project status
      const [updatedProject] = await db
        .update(projectTable)
        .set({
          status: status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTable.id, projectId),
            eq(projectTable.companyId, companyId as string)
          )
        )
        .returning();

      if (!updatedProject) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              "Project not found or you are not authorized to update it"
            )
          );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedProject,
            "Project status updated successfully"
          )
        );
    } catch (error) {
      console.error("Error updating project status:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getProjectStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const companyId = req.user?.companyId;

      // Validate project ID
      if (!projectId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project ID is required"));
      }

      // Check if project exists and belongs to the company
      const project = await db
        .select()
        .from(projectTable)
        .where(
          and(
            eq(projectTable.id, projectId),
            eq(projectTable.companyId, companyId as string)
          )
        )
        .limit(1);

      if (!project.length) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Project not found or unauthorized"));
      }

      // Get all tasks for the project
      const tasks = await db
        .select({
          id: taskTable.id,
          status: taskTable.status,
          endDate: taskTable.endDate,
        })
        .from(taskTable)
        .where(eq(taskTable.projectId, projectId));

      // Calculate task statistics
      const taskStats = [{
        totalTasks: tasks.length,
        todo: tasks.filter(task => task.status === "to-do").length,
        inProgress: tasks.filter(task => task.status === "in-progress").length,
        completed: tasks.filter(task => task.status === "completed").length,
        hold: tasks.filter(task => task.status === "hold").length,
        review: tasks.filter(task => task.status === "review").length,
      }];

      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalize to start of day
      const overDueTasks = tasks.filter(task =>
        task.endDate &&
        new Date(task.endDate) < now &&
        task.status !== "completed"
      ).length;

      // Calculate completion rate
      const completionRate =
        taskStats[0].totalTasks > 0
          ? Math.round((taskStats[0].completed / taskStats[0].totalTasks) * 100)
          : 0;

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            tasks: {
              total: taskStats[0].totalTasks,
              todo: taskStats[0].todo,
              inProgress: taskStats[0].inProgress,
              completed: taskStats[0].completed,
              hold: taskStats[0].hold,
              review: taskStats[0].review,
              completionRate: completionRate,
              overDueTasks: overDueTasks,
            },
          },
          "Project statistics retrieved successfully"
        )
      );
    } catch (error) {
      console.error("Error fetching project statistics:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const updateProjectDescription = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { description } = req.body;
      const companyId = req.user?.companyId;

      // Validate required fields
      if (!projectId || typeof description !== "string") {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, "Project ID and description are required")
          );
      }

      // Update the project description
      const [updatedProject] = await db
        .update(projectTable)
        .set({
          description,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTable.id, projectId),
            eq(projectTable.companyId, companyId as string)
          )
        )
        .returning();

      if (!updatedProject) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              "Project not found or you are not authorized to update it"
            )
          );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedProject,
            "Project description updated successfully"
          )
        );
    } catch (error) {
      console.error("Error updating project description:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getUserTasksByProject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User not found"));
      }

      // First get tasks with projects
      const tasksWithProjects = await db
        .select({
          projectId: taskTable.projectId,
          projectName: projectTable.name,
          taskCount: sql<number>`count(${taskTable.id})::int`,
        })
        .from(taskTable)
        .leftJoin(
          projectTable,
          eq(taskTable.projectId, projectTable.id)
        )
        .where(
          and(
            eq(taskTable.assignedTo, userId),
            eq(projectTable.companyId, companyId),
            isNotNull(taskTable.projectId)
          )
        )
        .groupBy(taskTable.projectId, projectTable.name);

      // Get count of tasks without projects
      const [tasksWithoutProject] = await db
        .select({
          taskCount: sql<number>`count(${taskTable.id})::int`,
        })
        .from(taskTable)
        .where(
          and(
            eq(taskTable.assignedTo, userId),
            isNull(taskTable.projectId)
          )
        );

      // Combine the results
      const result = {
        projectTasks: tasksWithProjects.map(task => ({
          projectName: task.projectName,
          taskCount: task.taskCount
        })),
        otherTasks: tasksWithoutProject?.taskCount || 0
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "User task counts by project fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching user task counts by project:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getProjectChartData = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { timeframe } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Validate timeframe parameter
      const validTimeframes = ["3months", "6months", "1year"];
      if (!timeframe || !validTimeframes.includes(timeframe)) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Invalid timeframe. Valid options: 3months, 6months, 1year"
            )
          );
      }

      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case "3months":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "6months":
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case "1year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Set time to start of day for startDate and end of day for endDate
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Get all projects within the date range for the company
      const projects = await db
        .select({
          id: projectTable.id,
          status: projectTable.status,
          startDate: projectTable.startDate,
        })
        .from(projectTable)
        .where(
          and(
            eq(projectTable.companyId, companyId),
            sql`${projectTable.startDate} >= ${startDate}`,
            sql`${projectTable.startDate} <= ${endDate}`
          )
        );

      // Create a map to store daily counts
      const dailyData = new Map<string, { total: number; completed: number }>();

      // Initialize all dates in the range with zero counts
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dailyData.set(dateStr, { total: 0, completed: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count projects by date
      projects.forEach(project => {
        if (project.startDate) {
          const dateStr = project.startDate.toISOString().split('T')[0];
          const existing = dailyData.get(dateStr) || { total: 0, completed: 0 };
          
          existing.total += 1;
          if (project.status === "completed") {
            existing.completed += 1;
          }
          
          dailyData.set(dateStr, existing);
        }
      });

      // Convert map to array format similar to the reference chartData
      const chartData = Array.from(dailyData.entries())
        .map(([date, counts]) => ({
          date,
          totalProjects: counts.total,
          completedProjects: counts.completed,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              timeframe,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              chartData,
            },
            "Project chart data fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching project chart data:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getRecentProjects = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // First get the 5 most recent projects
      const projects = await db
        .select({
          id: projectTable.id,
          name: projectTable.name,
          status: projectTable.status,
          startDate: projectTable.startDate,
        })
        .from(projectTable)
        .where(eq(projectTable.companyId, companyId))
        .orderBy(sql`${projectTable.startDate} DESC NULLS LAST`)
        .limit(5);

      // Get assigned employees count for each project
      const projectIds = projects.map(project => project.id);
      
      const employeeCounts = await db
        .select({
          projectId: projectAssignmentsTable.projectId,
          employeeCount: sql<number>`count(${projectAssignmentsTable.userId})::int`,
        })
        .from(projectAssignmentsTable)
        .where(inArray(projectAssignmentsTable.projectId, projectIds))
        .groupBy(projectAssignmentsTable.projectId);

      // Get task counts for each project
      const taskCounts = await db
        .select({
          projectId: taskTable.projectId,
          taskCount: sql<number>`count(${taskTable.id})::int`,
        })
        .from(taskTable)
        .where(inArray(taskTable.projectId, projectIds))
        .groupBy(taskTable.projectId);

      // Create a map for quick lookup
      const employeeCountMap = new Map(
        employeeCounts.map(({ projectId, employeeCount }) => [projectId, employeeCount])
      );
      
      const taskCountMap = new Map(
        taskCounts.map(({ projectId, taskCount }) => [projectId, taskCount])
      );

      // Combine all the data
      const projectsWithCounts = projects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        assignedEmployees: employeeCountMap.get(project.id) || 0,
        totalTasks: taskCountMap.get(project.id) || 0,
        startDate: project.startDate,
      }));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            projectsWithCounts,
            "Recent projects fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching recent projects:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);



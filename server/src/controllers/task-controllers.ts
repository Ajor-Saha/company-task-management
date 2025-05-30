import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { and, eq, isNull, desc } from "drizzle-orm";
import { taskTable, projectTable, userTable } from "../db/schema";

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
    }

    const { name, description, assignedTo, projectId } = req.body;

    // Validate required fields
    if (
      !name ||
      name.trim() === "" ||
      !assignedTo ||
      assignedTo.trim() === "" ||
      !projectId ||
      projectId.trim() === ""
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Task name, assignedTo, and projectId are required"
          )
        );
    }

    // Check that assigned user belongs to the same company
    const [assignedUser] = await db
      .select()
      .from(userTable)
      .where(
        and(
          eq(userTable.userId, assignedTo),
          eq(userTable.companyId, companyId)
        )
      );

    if (!assignedUser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Assigned user does not belong to your company"
          )
        );
    }

    // Validate projectId and ensure it belongs to the same company
    const [project] = await db
      .select()
      .from(projectTable)
      .where(
        and(
          eq(projectTable.id, projectId),
          eq(projectTable.companyId, companyId)
        )
      );

    if (!project) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Project not found or does not belong to your company"
          )
        );
    }

    const newTask = {
      id: uuidv4(),
      name,
      description: description || null,
      assignedTo,
      projectId,
    };

    const [createdTask] = await db
      .insert(taskTable)
      .values(newTask)
      .returning();

    return res
      .status(201)
      .json(new ApiResponse(201, createdTask, "Task created successfully"));
  } catch (error) {
    console.error("Error creating task:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export const createPersonalTask = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      const { name, description, endDate } = req.body;

      if (!name || name.trim() === "") {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Task name is required"));
      }

      // Optional: Validate endDate is a valid ISO string or timestamp
      let parsedEndDate: Date | null = null;
      if (endDate) {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          return res
            .status(400)
            .json(new ApiResponse(400, {}, "Invalid due date"));
        }
        parsedEndDate = date;
      }

      const [assignedUser] = await db
        .select()
        .from(userTable)
        .where(
          and(
            eq(userTable.userId, req.user?.userId),
            eq(userTable.companyId, companyId)
          )
        );

      if (!assignedUser) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Assigned user does not belong to your company"
            )
          );
      }

      const newTask = {
        id: uuidv4(),
        name,
        description: description || null,
        assignedTo: req.user?.userId,
        projectId: null, // personal task
        endDate: parsedEndDate,
      };

      const [createdTask] = await db
        .insert(taskTable)
        .values(newTask)
        .returning();

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            createdTask,
            "Personal task created successfully"
          )
        );
    } catch (error) {
      console.error("Error creating personal task:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getTasksByProjectId = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      const { projectId } = req.params;

      if (!projectId || projectId.trim() === "") {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project ID is required"));
      }

      // Validate project ownership
      const [project] = await db
        .select()
        .from(projectTable)
        .where(
          and(
            eq(projectTable.id, projectId),
            eq(projectTable.companyId, companyId)
          )
        );

      if (!project) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              "Project not found or does not belong to your company"
            )
          );
      }

      // Fetch tasks with assigned user details
      const tasks = await db
        .select({
          id: taskTable.id,
          name: taskTable.name,
          description: taskTable.description,
          status: taskTable.status,
          endDate: taskTable.endDate,
          createdAt: taskTable.createdAt,
          updatedAt: taskTable.updatedAt,
          assignedTo: {
            userId: userTable.userId,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            avatar: userTable.avatar,
          },
        })
        .from(taskTable)
        .innerJoin(userTable, eq(taskTable.assignedTo, userTable.userId))
        .where(eq(taskTable.projectId, projectId));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            tasks,
            `Found ${tasks.length} task(s) for this project`
          )
        );
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
    }

    const { taskId } = req.params;
    const { name, description, assignedTo, status, endDate } = req.body;

    const [existingTask] = await db
      .select({
        taskId: taskTable.id,
        projectId: taskTable.projectId,
      })
      .from(taskTable)
      .where(eq(taskTable.id, taskId));

    if (!existingTask) {
      return res.status(404).json(new ApiResponse(404, {}, "Task not found"));
    }

    // If a new assignedTo is provided, check user belongs to same company
    if (assignedTo) {
      const [assignee] = await db
        .select()
        .from(userTable)
        .where(
          and(
            eq(userTable.userId, assignedTo),
            eq(userTable.companyId, companyId)
          )
        );
      if (!assignee) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Assigned user does not belong to your company"
            )
          );
      }
    }

    // Prepare update fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status) updateData.status = status;
    if (endDate) updateData.endDate = new Date(endDate);

    const [updatedTask] = await db
      .update(taskTable)
      .set(updateData)
      .where(eq(taskTable.id, taskId))
      .returning();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
  } catch (error) {
    console.error("Error updating task:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
    }

    const { taskId } = req.params;

    const [task] = await db
      .select()
      .from(taskTable)
      .where(eq(taskTable.id, taskId));

    if (!task) {
      return res.status(404).json(new ApiResponse(404, {}, "Task not found"));
    }

    await db.delete(taskTable).where(eq(taskTable.id, taskId));

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Task deleted successfully"));
  } catch (error) {
    console.error("Error deleting task:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export const getPersonalTasks = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User not found"));
      }

      // Fetch tasks where assignedTo is the current user and projectId is null
      const personalTasks = await db
        .select()
        .from(taskTable)
        .where(
          and(eq(taskTable.assignedTo, userId), isNull(taskTable.projectId))
        );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            personalTasks,
            "Personal tasks fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching personal tasks:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getRecentTasks = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User not found"));
      }

      // Join with project table and alias project name
      const recentTasks = await db
        .select({
          id: taskTable.id,
          name: taskTable.name,
          status: taskTable.status,
          description: taskTable.description,
          endDate: taskTable.endDate,
          createdAt: taskTable.createdAt,
          projectId: taskTable.projectId,
          projectName: projectTable.name, // No need for `.nullable()`
        })
        .from(taskTable)
        .leftJoin(projectTable, eq(taskTable.projectId, projectTable.id))
        .where(eq(taskTable.assignedTo, userId))
        .orderBy(desc(taskTable.createdAt))
        .limit(6);

      return res
        .status(200)
        .json(
          new ApiResponse(200, recentTasks, "Recent tasks fetched successfully")
        );
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getAssignedMeTasks = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User not found"));
      }

      // Fetch tasks where assignedTo is the current user and projectId is null
      const assignedMeTasks = await db
        .select({
          id: taskTable.id,
          name: taskTable.name,
          status: taskTable.status,
          description: taskTable.description,
          endDate: taskTable.endDate,
          createdAt: taskTable.createdAt,
          projectId: taskTable.projectId,
          projectName: projectTable.name, // No need for `.nullable()`
        })
        .from(taskTable)
        .leftJoin(projectTable, eq(taskTable.projectId, projectTable.id))
        .where(eq(taskTable.assignedTo, userId))
        .orderBy(desc(taskTable.createdAt));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            assignedMeTasks,
            "Assigned Me tasks fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error fetching personal tasks:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getEmployeeTaskStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Get all employees in the company
      const employees = await db
        .select({
          userId: userTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
        })
        .from(userTable)
        .where(eq(userTable.companyId, companyId));

      // Get current date for overdue calculation
      const currentDate = new Date();

      // Fetch task statistics for each employee
      const employeeStats = await Promise.all(
        employees.map(async (employee) => {
          // Get all tasks for this employee
          const tasks = await db
            .select({
              status: taskTable.status,
              endDate: taskTable.endDate,
            })
            .from(taskTable)
            .where(eq(taskTable.assignedTo, employee.userId));

          // Calculate statistics
          const stats = {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            totalTasks: tasks.length,
            todo: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
          };

          // Calculate counts for each status
          tasks.forEach((task) => {
            switch (task.status) {
              case "to-do":
                stats.todo++;
                break;
              case "in-progress":
                stats.inProgress++;
                break;
              case "completed":
                stats.completed++;
                break;
            }

            // Check for overdue tasks (tasks not completed and past due date)
            if (
              task.status !== "completed" &&
              task.endDate &&
              new Date(task.endDate) < currentDate
            ) {
              stats.overdue++;
            }
          });

          return stats;
        })
      );

      return res.status(200).json(
        new ApiResponse(200, {
          employees: employeeStats,
          summary: {
            totalEmployees: employees.length,
            totalTasks: employeeStats.reduce(
              (sum, stat) => sum + stat.totalTasks,
              0
            ),
            totalOverdue: employeeStats.reduce(
              (sum, stat) => sum + stat.overdue,
              0
            ),
          },
        }, "Employee task statistics fetched successfully")
      );
    } catch (error) {
      console.error("Error fetching employee task statistics:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);



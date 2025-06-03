import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { and, eq, isNull, desc } from "drizzle-orm";
import { taskTable, projectTable, userTable } from "../db/schema";
import { createR2Client } from "../utils/upload-r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";

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
          taskFiles: taskTable.taskFiles,
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
          taskFiles: taskTable.taskFiles,
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
          taskFiles: taskTable.taskFiles,
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
        new ApiResponse(
          200,
          {
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
          },
          "Employee task statistics fetched successfully"
        )
      );
    } catch (error) {
      console.error("Error fetching employee task statistics:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const uploadTaskFiles = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User is missing"));
      }

      const { taskId } = req.params;
      const companyId = authUser.companyId;

      // Validate required fields
      if (!taskId || taskId.trim() === "") {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Task ID is required"));
      }

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Check if task exists and user has access to it
      const [existingTask] = await db
        .select({
          id: taskTable.id,
          projectId: taskTable.projectId,
          assignedTo: taskTable.assignedTo,
          taskFiles: taskTable.taskFiles,
        })
        .from(taskTable)
        .where(eq(taskTable.id, taskId));

      if (!existingTask) {
        return res.status(404).json(new ApiResponse(404, {}, "Task not found"));
      }

      // For personal tasks, check if the task is assigned to the current user
      if (existingTask.assignedTo !== authUser.userId) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              {},
              "Unauthorized: You can only upload files to your own tasks"
            )
          );
      }

      // Check for files from middleware
      let files = req.files;

      // If files is not an array, make it an array
      if (files && !Array.isArray(files)) {
        files = [files];
      }

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "No files uploaded"));
      }

      // Create R2 client (S3-compatible client)
      const r2 = createR2Client();

      const uploadedFiles = [];

      // Process each file
      for (const file of files) {
        if (!file || !file.filepath) {
          continue; // Skip invalid files
        }

        try {
          // Read the file from the temporary path
          const buffer = await fs.readFile(file.filepath);
          const fileId = nanoid();
          const uniqueFileName = `${fileId}-${encodeURIComponent(
            file.originalFilename || "unnamed"
          )}`;

          // Upload file to R2
          await r2.send(
            new PutObjectCommand({
              Bucket: process.env.BUCKET_NAME!,
              Key: uniqueFileName,
              Body: buffer,
              ContentType: file.mimetype || "application/octet-stream",
            })
          );

          // Clean up the temporary file
          await fs.unlink(file.filepath);

          // Construct file URL
          const fileUrl = `${process.env.PUBLIC_ACCESS_URL}/${uniqueFileName}`;

          uploadedFiles.push({
            id: fileId,
            url: fileUrl,
            originalName: file.originalFilename,
            size: file.size,
            mimeType: file.mimetype,
          });
        } catch (fileError) {
          console.error(
            `Error processing file ${file.originalFilename}:`,
            fileError
          );
          // Clean up the temporary file in case of error
          try {
            await fs.unlink(file.filepath);
          } catch (unlinkError) {
            console.error("Error cleaning up temporary file:", unlinkError);
          }
        }
      }

      if (uploadedFiles.length === 0) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, "No files were successfully uploaded")
          );
      }

      // Prepare new task files for database (only id and url as per schema)
      const newTaskFiles = uploadedFiles.map((file) => ({
        id: file.id,
        url: file.url,
      }));

      // Get existing task files and append new ones
      const existingTaskFiles = (existingTask.taskFiles as any[]) || [];
      const updatedTaskFiles = [...existingTaskFiles, ...newTaskFiles];

      // Update task in database with new files
      const [updatedTask] = await db
        .update(taskTable)
        .set({
          taskFiles: updatedTaskFiles,
        })
        .where(eq(taskTable.id, taskId))
        .returning();

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            files: uploadedFiles,
            task: {
              id: updatedTask.id,
              taskFiles: updatedTask.taskFiles,
            },
          },
          "Files uploaded and saved to task successfully"
        )
      );
    } catch (error) {
      console.error("Error uploading files:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal server error"));
    }
  }
);

export const deleteTaskFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authUser = req.user;
    if (!authUser) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized: User is missing"));
    }

    const { taskId, fileId } = req.query;

    // Validate required fields
    if (!taskId || typeof taskId !== 'string' || !fileId || typeof fileId !== 'string') {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Task ID and File ID are required"));
    }


    // Check if task exists and user has access to it
    const [existingTask] = await db
      .select({
        id: taskTable.id,
        projectId: taskTable.projectId,
        assignedTo: taskTable.assignedTo,
        taskFiles: taskTable.taskFiles,
      })
      .from(taskTable)
      .where(eq(taskTable.id, taskId));

    if (!existingTask) {
      return res.status(404).json(new ApiResponse(404, {}, "Task not found"));
    }

    // For personal tasks, check if the task is assigned to the current user
    if (existingTask.assignedTo !== authUser.userId) {
      return res
        .status(403)
        .json(
          new ApiResponse(
            403,
            {},
            "Unauthorized: You can only manage files of your own tasks"
          )
        );
    }

    // Find the file in the task's files
    const taskFiles = existingTask.taskFiles as { id: string; url: string }[] || [];
    const fileToDelete = taskFiles.find(file => file.id === fileId);

    if (!fileToDelete) {
      return res.status(404).json(new ApiResponse(404, {}, "File not found in task"));
    }

    // Extract the file key from the URL
    const fileKey = fileToDelete.url.split('/').pop();
    if (!fileKey) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid file URL"));
    }

    // Create R2 client
    const r2 = createR2Client();

    try {
      // Delete file from R2
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: fileKey,
        })
      );
    } catch (error) {
      console.error("Error deleting file from R2:", error);
      // Continue with task update even if R2 deletion fails
    }

    // Update task files list
    const updatedFiles = taskFiles.filter(file => file.id !== fileId);

    // Update task in database
    const [updatedTask] = await db
      .update(taskTable)
      .set({
        taskFiles: updatedFiles,
      })
      .where(eq(taskTable.id, taskId))
      .returning();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          task: {
            id: updatedTask.id,
            taskFiles: updatedTask.taskFiles,
          },
        },
        "File deleted successfully"
      )
    );
  } catch (error) {
    console.error("Error deleting task file:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});



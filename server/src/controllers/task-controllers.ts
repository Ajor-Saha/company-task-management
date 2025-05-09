import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
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
      assignedTo.trim() === ""
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Task name and assignedTo are required")
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

    // If projectId is provided, validate it
    if (projectId) {
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
    }

    const newTask = {
      id: uuidv4(),
      name,
      description: description || null,
      assignedTo,
      projectId: projectId || null,
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

      // Check if the project exists and belongs to the user's company
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

      // Get all tasks related to this project
      const tasks = await db
        .select()
        .from(taskTable)
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

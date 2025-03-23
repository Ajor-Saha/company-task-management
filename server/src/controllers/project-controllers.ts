import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { projectTable } from "../db/schema/tbl-project";
import { and, eq } from "drizzle-orm";

export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get companyId from the authenticated user
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Get project details from the request body
      const { name, description, budget } = req.body;

      // Validate required fields
      if (!name || name.trim() === "" || !description || description.trim() === "" || !budget || isNaN(Number(budget))) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project name, description, budget  is required"));
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

      // Query the project table for projects that belong to the company
      const companyProjects = await db
        .select({
          id: projectTable.id,
          name: projectTable.name,
          description: projectTable.description,
          budget: projectTable.budget,
          status: projectTable.status,
          companyId: projectTable.companyId,
          createdAt: projectTable.createdAt,
          updatedAt: projectTable.updatedAt,
        })
        .from(projectTable)
        .where(eq(projectTable.companyId, companyId));

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
      const { name, description, budget } = req.body;
      if (!name && !description && budget === undefined) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "At least one field (name, description, or budget) must be provided for update"
            )
          );
      }

      // Build update values object with only provided fields
      const updateValues: {
        name?: string;
        description?: string;
        budget?: number;
      } = {};
      if (name) updateValues.name = name;
      if (description) updateValues.description = description;
      if (budget !== undefined) updateValues.budget = Number(budget);

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
      return res.status(400).json({
        statusCode: 400,
        data: {},
        message: "Project ID is required",
      });
    }

    // Find the project first
    const project = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.id, projectId));

    if (!project.length) {
      return res.status(404).json({
        statusCode: 404,
        data: {},
        message: "Project not found",
      });
    }

    // Ensure the project belongs to the user's company before deleting
    if (project[0].companyId !== companyId) {
      return res.status(403).json({
        statusCode: 403,
        data: {},
        message: "You are not authorized to delete this project",
      });
    }

    // Delete the project
    await db.delete(projectTable).where(eq(projectTable.id, projectId));

    return res.status(200).json({
      statusCode: 200,
      data: {},
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      statusCode: 500,
      data: {},
      message: "Internal Server Error",
    });
  }
});

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { companyTable } from "../db/schema/tbl-company";
import { eq } from "drizzle-orm";

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

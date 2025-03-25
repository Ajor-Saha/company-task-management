import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { userTable } from "../db/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export const addEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const companyId = req.user.companyId; // Get companyId from authenticated user

    if (!companyId || req.user.role !== "admin") {
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

    // Validate required fields
    if (
      [firstName, lastName, email, password, role].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "All fields are required"));
    }

    // Check if the email is already in use
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User already exists with this email"));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = {
      userId: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      companyId,
      role, // Role is provided by admin
      isVerified: true, // Since the admin is adding, we mark as verified
    };

    await db.insert(userTable).values(newEmployee);

    return res
      .status(201)
      .json(new ApiResponse(201, newEmployee, "Employee added successfully"));
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
});

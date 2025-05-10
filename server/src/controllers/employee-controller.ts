import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import {
  userTable,
  companyTable,
  projectTable,
  projectAssignmentsTable,
} from "../db/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq, ilike, or, and, sql, SQL, count, notInArray } from "drizzle-orm";
import { sendEmployeeDetailsEmail } from "../utils/send-employee-crediential";
import jwt from "jsonwebtoken";

const VALID_ROLES = ["admin", "senior_employee", "assigned_employee"] as const;
type Role = (typeof VALID_ROLES)[number];

export const addEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const companyId = req.user.companyId; // Get companyId from authenticated admin user

    // Check if the user is an admin
    if (!companyId || req.user.role !== "admin") {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            {},
            "Unauthorized: You are not an admin or company not found"
          )
        );
    }

    // Fetch the company name using companyId
    const companyData = await db
      .select({ name: companyTable.name })
      .from(companyTable)
      .where(eq(companyTable.id, companyId))
      .limit(1);

    if (companyData.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Company not found"));
    }

    const companyName = companyData[0].name;

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
      role,
      isVerified: true, // Since the admin is adding, we mark as verified
    };

    await db.insert(userTable).values(newEmployee);

    // Send email to employee with credentials
    await sendEmployeeDetailsEmail(email, firstName, password, companyName);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newEmployee,
          "Employee added successfully and email sent"
        )
      );
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
});

export const employeeLogin = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if ([email, password].some((field) => !field || field.trim() === "")) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Email and password are required"));
      }

      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email));

      if (!user || !user[0].isVerified) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              "User not found or Not Verified or Not Admin"
            )
          );
      }

      const isPasswordValid = await bcrypt.compare(password, user[0].password);

      if (!isPasswordValid) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Invalid credentials"));
      }

      let accessToken;
      try {
        accessToken = jwt.sign(
          { userId: user[0].userId, email: user[0].email },
          process.env.JWT_SECRET as string,
          { expiresIn: "1d" }
        );
      } catch (jwtError) {
        console.error("JWT Error:", jwtError);
        return res
          .status(500)
          .json(new ApiResponse(500, null, "Failed to generate token"));
      }

      // Set the access token as a cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true, // Prevent access from JavaScript
        secure: true, // Ensure the cookie is sent only over HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: "none", // Required for cross-origin cookies
      });

      const loginUser = user[0];

      return res.status(200).json({
        data: loginUser,
        accessToken: accessToken,
        message: "Login successful",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getAllEmployees = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId; // Assuming companyId is a string (e.g., uuid)

      // Ensure the user is an admin and companyId exists
      if (!companyId || req.user.role !== "admin") {
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              {},
              "Unauthorized: You are not an admin or company not found"
            )
          );
      }

      // Extract query parameters with defaults
      const pageNumber = req.query.pageNumber
        ? Number(req.query.pageNumber)
        : 1;
      const perPage = req.query.perPage ? Number(req.query.perPage) : 9;
      const search = req.query.search
        ? (req.query.search as string).trim()
        : undefined;
      const filter = req.query.filter
        ? (req.query.filter as string)
        : undefined;

      // Build conditions array with explicit type
      const conditions: SQL<unknown>[] = [eq(userTable.companyId, companyId)];

      // Add search condition if provided
      if (search) {
        conditions.push(
          ilike(
            sql`${userTable.firstName} || ' ' || ${userTable.lastName}`,
            `%${search}%`
          )
        );
      }

      // Add role filter if provided and valid
      if (filter && VALID_ROLES.includes(filter as Role)) {
        conditions.push(eq(userTable.role, filter as Role));
      }

      // Count total data matching the conditions
      const whereClause = and(...conditions);

      // ** Fetch total count of matching customers **
      const totalQuery = await db
        .select({ total: count() })
        .from(userTable)
        .where(whereClause);
      const total = totalQuery[0].total;

      // Fetch employees with pagination
      const employees = await db
        .select({
          userId: userTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
          role: userTable.role,
          isVerified: userTable.isVerified,
          createdAt: userTable.createdAt,
        })
        .from(userTable)
        .where(and(...conditions))
        .orderBy(userTable.createdAt)
        .limit(perPage)
        .offset((pageNumber - 1) * perPage);

      return res.status(200).json({
        success: true,
        message: "Employees retrieved successfully",
        data: {
          employees,
          total,
          pageNumber,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getCompanyEmployees = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;

      // Check if the user is an admin and has a companyId
      if (!companyId) {
        return res.status(401).json(
          new ApiResponse(
            401,
            {},
            "Unauthorized: You are not an admin or company not found"
          )
        );
      }

      // Fetch all employees for the company
      const employees = await db
        .select({
          userId: userTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          avatar: userTable.avatar,
          email: userTable.email,
          role: userTable.role,
          isVerified: userTable.isVerified,
          createdAt: userTable.createdAt,
        })
        .from(userTable)
        .where(eq(userTable.companyId, companyId))
        .orderBy(userTable.createdAt);

      return res.status(200).json(
        new ApiResponse(
          200,
          employees,
          "Employees retrieved successfully"
        )
      );
    } catch (error) {
      console.error("Error fetching employees:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const updateEmployee = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const { firstName, lastName, role } = req.body;
      const companyId = req.user.companyId;

      // Check if the user is an admin
      if (!companyId || req.user.role !== "admin") {
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              {},
              "Unauthorized: You are not an admin or company not found"
            )
          );
      }

      // Ensure at least one field is provided for update
      if (!firstName && !lastName && !role) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "At least one field (firstName, lastName, role) is required to update"
            )
          );
      }

      // Check if employee exists and belongs to the same company
      const existingUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.userId, employeeId))
        .limit(1);

      if (existingUser.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Employee not found"));
      }

      if (existingUser[0].companyId !== companyId) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              {},
              "You are not authorized to update this employee"
            )
          );
      }

      // Prepare update data
      const updateData: Partial<typeof userTable.$inferInsert> = {};
      if (firstName) updateData.firstName = firstName.trim();
      if (lastName) updateData.lastName = lastName.trim();
      if (role) updateData.role = role.trim();

      // Perform the update
      await db
        .update(userTable)
        .set(updateData)
        .where(eq(userTable.userId, employeeId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Employee updated successfully"));
    } catch (error) {
      console.error("Error updating employee:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const deleteEmployee = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const companyId = req.user.companyId;

      // Check if the user is an admin
      if (!companyId || req.user.role !== "admin") {
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              {},
              "Unauthorized: You are not an admin or company not found"
            )
          );
      }
      // Check if employee exists and belongs to the same company
      const existingUser = await db
        .select()
        .from(userTable)
        .where(
          and(
            eq(userTable.userId, employeeId),
            eq(userTable.companyId, companyId)
          )
        )
        .limit(1);

      if (existingUser.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Employee not found"));
      }

      // Delete the employee
      await db.delete(userTable).where(eq(userTable.userId, employeeId));

      
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Employee deleted successfully"));
    } catch (error) {
      console.error("Error deleting employee:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getAvailableEmployeeToProject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const companyId = req.user.companyId;

      // Ensure required query parameters are provided
      if (!projectId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Missing required query parameters"));
      }

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
            eq(projectTable.id, projectId as string),
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

      const assignedEmployees = await db
        .select({
          userId: projectAssignmentsTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
          avatar: userTable.avatar,
          role: userTable.role,
        })
        .from(projectAssignmentsTable)
        .innerJoin(
          userTable,
          eq(projectAssignmentsTable.userId, userTable.userId)
        )
        .where(eq(projectAssignmentsTable.projectId, projectId as string));

      // Extract assigned IDs
      const assignedIds = assignedEmployees.map((e) => e.userId);

      // 2. Fetch all employees eligible for assignment (role = 'assigned_employee')
      //    then filter out those already assigned
      const availableEmployees = await db
        .select({
          userId: userTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          email: userTable.email,
          avatar: userTable.avatar,
          role: userTable.role,
        })
        .from(userTable)
        .where(
          and(
            eq(userTable.companyId, companyId), // same company
            assignedIds.length
              ? notInArray(userTable.userId, assignedIds)
              : undefined // exclude assigned
          )
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            assignedEmployees,
            availableEmployees,
          },
          "Fetched assigned and available employee lists successfully"
        )
      );
    } catch (error) {
      console.error("Error assigning employee to project:", error);
      res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

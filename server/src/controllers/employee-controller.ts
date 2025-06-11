import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import {
  userTable,
  companyTable,
  projectTable,
  projectAssignmentsTable,
  taskTable,
} from "../db/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq, ilike, or, and, sql, SQL, count, notInArray } from "drizzle-orm";
import { sendEmployeeDetailsEmail } from "../utils/send-employee-crediential";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const VALID_ROLES = ["admin", "senior_employee", "assigned_employee"] as const;
type Role = (typeof VALID_ROLES)[number];

// Initialize Google Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
        httpOnly: true,
        secure: true, // Ensure HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: "none", // Required for cross-origin
        domain: ".taskforges.com", // Add domain for cross-subdomain sharing
        path: "/",
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
          salary: userTable.salary,
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

      // Fetch all employees for the company
      const employees = await db
        .select({
          userId: userTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          avatar: userTable.avatar,
          email: userTable.email,
          role: userTable.role,
          salary: userTable.salary,
          isVerified: userTable.isVerified,
          createdAt: userTable.createdAt,
        })
        .from(userTable)
        .where(eq(userTable.companyId, companyId))
        .orderBy(userTable.createdAt);

      return res
        .status(200)
        .json(
          new ApiResponse(200, employees, "Employees retrieved successfully")
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
      const { firstName, lastName, role, salary } = req.body;
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
      if (!firstName && !lastName && !role && !salary) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "At least one field (firstName, lastName, role, salary) is required to update"
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
      if (salary) updateData.salary = salary.toString().trim();

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

export const getEmployeeStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const companyId = req.user.companyId;

      // Check if the employee exists and belongs to the company
      const employee = await db
        .select({
          userId: userTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          role: userTable.role,
          companyId: userTable.companyId,
          avatar: userTable.avatar,
        })
        .from(userTable)
        .where(
          and(
            eq(userTable.userId, employeeId),
            eq(userTable.companyId, companyId)
          )
        )
        .limit(1);

      if (!employee.length) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Employee not found"));
      }

      // Get task statistics with end date for overdue calculation
      const allTasks = await db
        .select({
          id: taskTable.id,
          status: taskTable.status,
          endDate: taskTable.endDate,
        })
        .from(taskTable)
        .where(eq(taskTable.assignedTo, employeeId));

      const currentDate = new Date();

      // Count tasks by status and calculate overdue tasks
      const taskStats = [
        {
          totalTasks: allTasks.length,
          todo: allTasks.filter((task) => task.status === "to-do").length,
          inProgress: allTasks.filter((task) => task.status === "in-progress")
            .length,
          completed: allTasks.filter((task) => task.status === "completed")
            .length,
          hold: allTasks.filter((task) => task.status === "hold").length,
          review: allTasks.filter((task) => task.status === "review").length,
          overdue: allTasks.filter(
            (task) =>
              task.endDate &&
              new Date(task.endDate) < currentDate &&
              task.status !== "completed"
          ).length,
        },
      ];

      // Get projects where employee is directly assigned
      const directlyAssignedProjects = await db
        .select({
          projectId: projectAssignmentsTable.projectId,
        })
        .from(projectAssignmentsTable)
        .where(eq(projectAssignmentsTable.userId, employeeId));

      // Get projects where employee has tasks assigned
      const projectsFromTasks = await db
        .select({
          projectId: taskTable.projectId,
        })
        .from(taskTable)
        .where(eq(taskTable.assignedTo, employeeId));

      // Combine and get unique project count using Set
      const allProjectIds = new Set([
        ...directlyAssignedProjects.map((p) => p.projectId),
        ...projectsFromTasks.map((p) => p.projectId),
      ]);

      // Calculate task completion rate
      const completionRate =
        taskStats[0].totalTasks > 0
          ? Math.round((taskStats[0].completed / taskStats[0].totalTasks) * 100)
          : 0;

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            employee: {
              userId: employee[0].userId,
              name: `${employee[0].firstName} ${employee[0].lastName}`,
              role: employee[0].role,
              avatar: employee[0].avatar,
            },
            stats: {
              tasks: {
                total: taskStats[0].totalTasks,
                todo: taskStats[0].todo,
                inProgress: taskStats[0].inProgress,
                completed: taskStats[0].completed,
                hold: taskStats[0].hold,
                review: taskStats[0].review,
                overdue: taskStats[0].overdue,
                completionRate: completionRate,
              },
              projects: {
                total: allProjectIds.size,
              },
            },
          },
          "Employee statistics retrieved successfully"
        )
      );
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const analyzeEmployeePerformance = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const employeeStatsData = req.body;

      // Check if user has permission (admin or senior_employee)
      if (
        !companyId ||
        (req.user.role !== "admin" && req.user.role !== "senior_employee")
      ) {
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              {},
              "Unauthorized: Only admins and senior employees can analyze performance"
            )
          );
      }

      // Validate that employee stats data is provided
      if (
        !employeeStatsData ||
        !employeeStatsData.employee ||
        !employeeStatsData.stats
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, "Employee statistics data is required")
          );
      }

      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, "AI service not configured"));
      }

      // Create the prompt for AI analysis
      const prompt = `You are an AI HR assistant helping evaluate employee performance. Based on the following JSON data, analyze the employee's productivity, identify strengths and weaknesses, suggest improvements, and give a simple recommendation on whether the employee should be supported, warned, reassigned, or considered for termination.
                        Please provide the response in this structure:
                          1. Performance Summary
                          2. Key Observations
                          3. Improvement Suggestions (in simple language)
                          4. AI Recommendation (short and clear)
                        Here is the employee data: ${JSON.stringify(employeeStatsData, null, 2)}`;

      console.log("Sending request to Gemini AI for employee analysis...");

      // Generate AI response using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro-preview-06-05",
        contents: prompt,
      });

      const aiAnalysis = response?.text || "";

      if (!aiAnalysis) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, "Failed to generate AI analysis"));
      }

      console.log("AI analysis completed successfully");

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            employeeData: employeeStatsData,
            aiAnalysis: aiAnalysis,
            generatedAt: new Date().toISOString(),
          },
          "Employee performance analysis completed successfully"
        )
      );
    } catch (error) {
      console.error("Error analyzing employee performance:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Handle specific Gemini API errors
      if (errorMessage.includes("API_KEY")) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, "AI service authentication failed"));
      }

      if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
        return res
          .status(429)
          .json(
            new ApiResponse(
              429,
              {},
              "AI service rate limit exceeded. Please try again later."
            )
          );
      }

      return res
        .status(500)
        .json(
          new ApiResponse(500, {}, "Failed to analyze employee performance")
        );
    }
  }
);

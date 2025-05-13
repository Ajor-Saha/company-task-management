import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { messageTable } from "../db/schema/tbl-message";
import { userTable } from "../db/schema/tbl-user";

export const getProjectMessages = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Project ID is required"));
      }

      // Join messages with sender info
      const messages = await db
        .select({
          id: messageTable.id,
          content: messageTable.content,
          projectId: messageTable.projectId,
          createdAt: messageTable.createdAt,
          sender: {
            userId: userTable.userId,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            avatar: userTable.avatar,
          },
        })
        .from(messageTable)
        .leftJoin(userTable, eq(messageTable.senderId, userTable.userId))
        .where(eq(messageTable.projectId, projectId))
        .orderBy(messageTable.createdAt);

      return res
        .status(200)
        .json(new ApiResponse(200, messages, "Messages fetched successfully"));
    } catch (error) {
      console.error("Error fetching project messages:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

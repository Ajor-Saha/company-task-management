import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { botMessageTable } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { ConversationData } from "../types/common";



export const saveBotMessages = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User not found"));
      }

      const { messages }: ConversationData = req.body;

      // Validate the messages
      if (!messages || messages.length === 0) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "No messages to save"));
      }

      // Save each message pair (user message and bot response) to the database
      const savedMessages = [];
      for (let i = 0; i < messages.length; i += 2) {
        const userMessage = messages[i];
        const botMessage = messages[i + 1];

        if (userMessage?.role === "user" && botMessage?.role === "assistant") {
          const messageId = uuidv4();
          const savedMessage = await db.insert(botMessageTable).values({
            id: messageId,
            userId: userId,
            userMessage: userMessage.content,
            botMessage: botMessage.content,
          });
          savedMessages.push(savedMessage);
        }
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
             savedMessages,
            "Chat messages saved successfully"
          )
        );
    } catch (error) {
      console.error("Error saving chat messages:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getUserBotMessages = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User not found"));
      }

      const messages = await db
        .select({
          id: botMessageTable.id,
          userMessage: botMessageTable.userMessage,
          botMessage: botMessageTable.botMessage,
          createdAt: botMessageTable.createdAt,
        })
        .from(botMessageTable)
        .where(eq(botMessageTable.userId, userId))
        .orderBy(desc(botMessageTable.createdAt));

      return res
        .status(200)
        .json(
          new ApiResponse(200, messages, "Chat messages retrieved successfully")
        );
    } catch (error) {
      console.error("Error retrieving chat messages:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const deleteBotMessage = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: User not found"));
      }

      // Delete all messages for this user
      await db
        .delete(botMessageTable)
        .where(eq(botMessageTable.userId, userId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "All messages deleted successfully"));

    } catch (error) {
      console.error("Error deleting messages:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

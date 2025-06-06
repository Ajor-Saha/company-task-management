import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { and, eq, desc } from "drizzle-orm";
import { userTable, postTable } from "../db/schema";
import { createR2Client } from "../utils/upload-r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import { nanoid } from "nanoid";

// Match the PostFile type from schema
type PostFile = {
  id: string;
  url: string;
};

export const createNewPost = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      const { title, content } = req.body;

      // Validate required fields
      if (!title?.trim()) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Title is required"));
      }

      if (!content?.trim()) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Content is required"));
      }

      // Verify user belongs to company
      const [user] = await db
        .select()
        .from(userTable)
        .where(
          and(
            eq(userTable.userId, req.user?.userId),
            eq(userTable.companyId, companyId)
          )
        );

      if (!user) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "User does not belong to the company"));
      }

      let uploadedFiles: PostFile[] = [];

      // Check for files from middleware
      let files = req.files;

      // Process files if they exist
      if (files) {
        // If files is not an array, make it an array
        if (!Array.isArray(files)) {
          files = [files];
        }

        if (files.length > 0) {
          // Create R2 client (S3-compatible client)
          const r2 = createR2Client();

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

              // Only store id and url as per schema
              uploadedFiles.push({
                id: fileId,
                url: fileUrl,
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
        }
      }

      // Create new post
      const newPost = {
        id: uuidv4(),
        title,
        content,
        userId: req.user?.userId,
        companyId,
        files: uploadedFiles,
      };

      const [createdPost] = await db
        .insert(postTable)
        .values(newPost)
        .returning();

      return res
        .status(201)
        .json(new ApiResponse(201, createdPost, "Post created successfully"));

    } catch (error) {
      console.error("Error creating post:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const getCompanyPosts = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Get all posts for the company with user information
      const posts = await db
        .select({
          id: postTable.id,
          title: postTable.title,
          content: postTable.content,
          files: postTable.files,
          createdAt: postTable.createdAt,
          updatedAt: postTable.updatedAt,
          userId: userTable.userId,
          userEmail: userTable.email,
        })
        .from(postTable)
        .where(eq(postTable.companyId, companyId))
        .innerJoin(userTable, eq(postTable.userId, userTable.userId))
        .orderBy(desc(postTable.createdAt));

      return res
        .status(200)
        .json(new ApiResponse(200, posts, "Posts retrieved successfully"));

    } catch (error) {
      console.error("Error fetching company posts:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const editPost = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const postId = req.params.postId;
      const { title, content } = req.body;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Find the existing post
      const [existingPost] = await db
        .select()
        .from(postTable)
        .where(
          and(
            eq(postTable.id, postId),
            eq(postTable.companyId, companyId)
          )
        );

      if (!existingPost) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Post not found"));
      }

      // Verify user has permission (post creator or admin)
      if (existingPost.userId !== req.user?.userId) {
        return res
          .status(403)
          .json(new ApiResponse(403, {}, "Not authorized to edit this post"));
      }

      let uploadedFiles: PostFile[] = existingPost.files || [];

      // Process new files if they exist
      let files = req.files;
      if (files) {
        if (!Array.isArray(files)) {
          files = [files];
        }

        if (files.length > 0) {
          const r2 = createR2Client();

          for (const file of files) {
            if (!file || !file.filepath) continue;

            try {
              const buffer = await fs.readFile(file.filepath);
              const fileId = nanoid();
              const uniqueFileName = `${fileId}-${encodeURIComponent(
                file.originalFilename || "unnamed"
              )}`;

              await r2.send(
                new PutObjectCommand({
                  Bucket: process.env.BUCKET_NAME!,
                  Key: uniqueFileName,
                  Body: buffer,
                  ContentType: file.mimetype || "application/octet-stream",
                })
              );

              await fs.unlink(file.filepath);

              const fileUrl = `${process.env.PUBLIC_ACCESS_URL}/${uniqueFileName}`;

              uploadedFiles.push({
                id: fileId,
                url: fileUrl,
              });
            } catch (fileError) {
              console.error(
                `Error processing file ${file.originalFilename}:`,
                fileError
              );
              try {
                await fs.unlink(file.filepath);
              } catch (unlinkError) {
                console.error("Error cleaning up temporary file:", unlinkError);
              }
            }
          }
        }
      }

      // Update the post
      const [updatedPost] = await db
        .update(postTable)
        .set({
          title: title || existingPost.title,
          content: content || existingPost.content,
          files: uploadedFiles,
          updatedAt: new Date(),
        })
        .where(eq(postTable.id, postId))
        .returning();

      return res
        .status(200)
        .json(new ApiResponse(200, updatedPost, "Post updated successfully"));

    } catch (error) {
      console.error("Error updating post:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const deletePost = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const postId = req.params.postId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Find the post to delete
      const [existingPost] = await db
        .select()
        .from(postTable)
        .where(
          and(
            eq(postTable.id, postId),
            eq(postTable.companyId, companyId)
          )
        );

      if (!existingPost) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Post not found"));
      }

      // Verify user has permission (post creator or admin)
      if (existingPost.userId !== req.user?.userId) {
        return res
          .status(403)
          .json(new ApiResponse(403, {}, "Not authorized to delete this post"));
      }

      // Delete associated files from R2
      if (existingPost.files && existingPost.files.length > 0) {
        const r2 = createR2Client();

        for (const file of existingPost.files) {
          try {
            const fileName = file.url.split('/').pop();
            if (fileName) {
              await r2.send(
                new DeleteObjectCommand({
                  Bucket: process.env.BUCKET_NAME!,
                  Key: fileName,
                })
              );
            }
          } catch (error) {
            console.error(`Error deleting file from R2: ${file.url}`, error);
          }
        }
      }

      // Delete the post
      await db
        .delete(postTable)
        .where(eq(postTable.id, postId));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Post deleted successfully"));

    } catch (error) {
      console.error("Error deleting post:", error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);


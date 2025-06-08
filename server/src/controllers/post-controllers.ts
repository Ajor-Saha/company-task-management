import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "../utils/api-response";
import { db } from "../db";
import { and, eq, desc, sql } from "drizzle-orm";
import { userTable, postTable, projectTable } from "../db/schema";
import { createR2Client } from "../utils/upload-r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import { PostFile, Mention } from "../types/common";

// Match the PostFile type from schema


export const createNewPost = asyncHandler(
  async (req: Request, res: Response) => {
    console.log('=== CREATE POST REQUEST START ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('User info:', { userId: req.user?.userId, companyId: req.user?.companyId });
    
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        console.log('ERROR: No company ID found');
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Log the incoming request data for debugging
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      console.log('Request properties:', Object.keys(req));
      console.log('Request fields (if exists):', (req as any).fields);
      console.log('Request form (if exists):', (req as any).form);
      console.log('Request formData (if exists):', (req as any).formData);

      // Get data directly from req.body now that middleware attaches form fields
      const title = String(req.body.title || '');
      const content = String(req.body.content || '');
      const mentionData = req.body.mention;

      console.log('Extracted data:', { title, content, mentionData });

      // Validate required fields
      if (!title || title.trim().length === 0) {
        console.log('ERROR: Title validation failed');
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Title is required"));
      }

      if (!content || content.trim().length === 0) {
        console.log('ERROR: Content validation failed');
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Content is required"));
      }

      console.log('Basic validation passed');

      // Parse and validate mentions
      let mentions: Mention[] = [];
      try {
        if (mentionData) {
          console.log('Processing mentions:', mentionData);
          
          // Handle different formats of mentionData
          if (Array.isArray(mentionData) && mentionData.length > 0) {
            // If it's an array with JSON string
            if (typeof mentionData[0] === 'string') {
              try {
                mentions = JSON.parse(mentionData[0]);
              } catch (error) {
                console.error('Error parsing mention from array:', error);
                return res
                  .status(400)
                  .json(new ApiResponse(400, {}, "Invalid mention format. Cannot parse JSON from array."));
              }
            } else {
              // It's already an array of objects
              mentions = mentionData;
            }
          } else if (typeof mentionData === 'string') {
            // If it's a JSON string
            mentions = JSON.parse(mentionData);
          } else {
            // If it's a single object
            mentions = [mentionData];
          }
          
          // Ensure mentions is an array
          if (!Array.isArray(mentions)) {
            mentions = [mentions];
          }
          
          console.log('Parsed mentions:', mentions);
          
          // Validate each mention
          const isValidMention = mentions.every(m => 
            m && 
            (m.type === 'project' || m.type === 'employee') && 
            typeof m.id === 'string' && 
            m.id.length > 0
          );

          if (!isValidMention) {
            console.log('ERROR: Invalid mention format, validation failed');
            console.log('Mention objects:', mentions);
            return res
              .status(400)
              .json(new ApiResponse(400, {}, "Invalid mention format. Each mention must include valid type ('project' or 'employee') and id"));
          }
        }
        console.log('Mentions processed successfully:', mentions);
      } catch (error) {
        console.log('ERROR: Mention parsing failed:', error);
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Invalid mention data format"));
      }

      console.log('Starting user verification');
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
        console.log('ERROR: User not found in company');
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "User does not belong to the company"));
      }

      console.log('User verification passed');
      let uploadedFiles: PostFile[] = [];

      // Handle file uploads from FormData
      if (req.files) {
        console.log('Processing files:', req.files);
        const files = Array.isArray(req.files) ? req.files : [req.files];

        if (files.length > 0) {
          console.log(`Processing ${files.length} files`);
          const r2 = createR2Client();

          for (const file of files) {
            if (!file || !file.filepath) {
              console.log('Skipping invalid file:', file);
              continue;
            }

            try {
              console.log(`Processing file: ${file.originalFilename}`);
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
              console.log(`File processed successfully: ${uniqueFileName}`);
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
      } else {
        console.log('No files to process');
      }

      console.log('Creating post in database');
      // Create new post
      const newPost = {
        id: uuidv4(),
        title: title.trim(),
        content: content.trim(),
        userId: req.user?.userId,
        companyId,
        files: uploadedFiles,
        mention: mentions,
      };

      console.log('Post data to insert:', newPost);

      const [createdPost] = await db
        .insert(postTable)
        .values(newPost)
        .returning();

      console.log('Post created successfully:', createdPost);
      console.log('=== CREATE POST REQUEST END ===');

      return res
        .status(201)
        .json(new ApiResponse(201, createdPost, "Post created successfully"));

    } catch (error) {
      console.error("=== CREATE POST ERROR ===");
      console.error("Error creating post:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
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
      // Ensure page and limit are valid numbers and page is at least 1
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 5)); // Cap at 50 items per page
      const userId = req.query.userId;

      if (!companyId) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Calculate offset for pagination (page is 1-based)
      const offset = (page - 1) * limit;

      // Build base query conditions
      let conditions = [eq(postTable.companyId, companyId)];
      
      // Add user filter if provided
      if (userId && userId !== 'all') {
        conditions.push(eq(postTable.userId, String(userId)));
      }

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(postTable)
        .where(and(...conditions));

      // Calculate total pages
      const totalPages = Math.max(1, Math.ceil(Number(count) / limit));
      
      // Adjust page number if it exceeds total pages
      const adjustedPage = Math.min(page, totalPages);
      const adjustedOffset = (adjustedPage - 1) * limit;

      // Get posts with user information and enhanced mention data
      const posts = await db
        .select({
          id: postTable.id,
          title: postTable.title,
          content: postTable.content,
          files: postTable.files,
          mention: postTable.mention,
          createdAt: postTable.createdAt,
          updatedAt: postTable.updatedAt,
          user: {
            id: userTable.userId,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            email: userTable.email,
            avatar: userTable.avatar,
            role: userTable.role,
          },
        })
        .from(postTable)
        .where(and(...conditions))
        .innerJoin(userTable, eq(postTable.userId, userTable.userId))
        .orderBy(desc(postTable.createdAt))
        .limit(limit)
        .offset(adjustedOffset);

      // Enhance mentions with additional data
      const enhancedPosts = await Promise.all(
        posts.map(async (post) => {
          const enhancedMentions = await Promise.all(
            (post.mention as Mention[] || []).map(async (mention) => {
              if (mention.type === 'employee') {
                // Get employee details
                const [employee] = await db
                  .select({
                    id: userTable.userId,
                    firstName: userTable.firstName,
                    lastName: userTable.lastName,
                    avatar: userTable.avatar,
                    role: userTable.role,
                  })
                  .from(userTable)
                  .where(eq(userTable.userId, mention.id));

                return {
                  ...mention,
                  details: employee || null,
                };
              } else if (mention.type === 'project') {
                // Get project details
                const [project] = await db
                  .select({
                    id: projectTable.id,
                    name: projectTable.name,
                  })
                  .from(projectTable)
                  .where(eq(projectTable.id, mention.id));

                return {
                  ...mention,
                  details: project || null,
                };
              }
              return mention;
            })
          );

          return {
            ...post,
            mention: enhancedMentions,
          };
        })
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            posts: enhancedPosts,
            pagination: {
              total: Number(count),
              page: adjustedPage,
              limit: limit,
              totalPages: totalPages,
            },
          },
          "Posts retrieved successfully"
        )
      );
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
    console.log('=== EDIT POST REQUEST START ===');
    console.log('Post ID:', req.params.postId);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    try {
      const companyId = req.user?.companyId;
      const postId = req.params.postId;
      
      // Get fields from the request body and ensure they are strings
      const title = typeof req.body.title === 'string' ? req.body.title : String(req.body.title || '');
      const content = typeof req.body.content === 'string' ? req.body.content : String(req.body.content || '');
      let mention = req.body.mention;
      let existingFiles = req.body.existingFiles;
      
      if (!companyId) {
        console.log('ERROR: No company ID found');
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Parse mention if it's from FormData
      let parsedMention;
      if (mention) {
        try {
          if (Array.isArray(mention) && mention.length > 0) {
            // If it's an array with JSON string
            if (typeof mention[0] === 'string') {
              parsedMention = JSON.parse(mention[0]);
            } else {
              // It's already an array of objects
              parsedMention = mention;
            }
          } else if (typeof mention === 'string') {
            // If it's a JSON string
            parsedMention = JSON.parse(mention);
          } else {
            // If it's a single object
            parsedMention = mention;
          }
          
          // Ensure parsedMention is an array
          if (!Array.isArray(parsedMention)) {
            parsedMention = [parsedMention];
          }
          
          console.log('Parsed mention for edit:', parsedMention);
          mention = parsedMention;
        } catch (error) {
          console.error('Error parsing mention:', error);
          return res
            .status(400)
            .json(new ApiResponse(400, {}, "Invalid mention format. Cannot parse JSON."));
        }
      }

      // Parse existing files if provided
      let parsedExistingFiles = [];
      if (existingFiles) {
        try {
          parsedExistingFiles = JSON.parse(existingFiles);
        } catch (error) {
          console.error('Error parsing existing files:', error);
          return res
            .status(400)
            .json(new ApiResponse(400, {}, "Invalid existing files format"));
        }
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
        console.log('ERROR: Post not found');
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Post not found"));
      }

      // Verify user has permission (post creator or admin)
      const isAdmin = req.user?.role === 'admin';
      const isAuthor = existingPost.userId === req.user?.userId;

      if (!isAdmin && !isAuthor) {
        console.log('ERROR: User not authorized to edit post');
        return res
          .status(403)
          .json(new ApiResponse(403, {}, "Not authorized to edit this post"));
      }

      // Handle file uploads and updates
      let finalFiles = [...parsedExistingFiles];

      // Process new files if they exist
      if (req.files) {
        console.log('Processing new files:', req.files);
        const files = Array.isArray(req.files) ? req.files : [req.files];

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

              finalFiles.push({
                id: fileId,
                url: fileUrl,
              });
              
              console.log(`Successfully uploaded new file: ${uniqueFileName}`);
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

      // Delete removed files from R2
      const removedFiles = (existingPost.files as PostFile[]).filter(
        existingFile => !parsedExistingFiles.some(
          (keptFile: PostFile) => keptFile.id === existingFile.id
        )
      );

      if (removedFiles.length > 0) {
        console.log('Deleting removed files:', removedFiles);
        const r2 = createR2Client();

        await Promise.all(removedFiles.map(async (file) => {
          try {
            const fileName = file.url.split('/').pop();
            if (fileName) {
              await r2.send(
                new DeleteObjectCommand({
                  Bucket: process.env.BUCKET_NAME!,
                  Key: fileName,
                })
              );
              console.log(`Successfully deleted file: ${fileName}`);
            }
          } catch (error) {
            console.error(`Warning: Error deleting file from R2: ${file.url}`, error);
          }
        }));
      }

      // Update the post
      const [updatedPost] = await db
        .update(postTable)
        .set({
          title: title || existingPost.title,
          content: content || existingPost.content,
          files: finalFiles,
          mention: mention || existingPost.mention,
          updatedAt: new Date(),
        })
        .where(eq(postTable.id, postId))
        .returning();

      console.log('Post updated successfully:', updatedPost);
      console.log('=== EDIT POST REQUEST END ===');

      return res
        .status(200)
        .json(new ApiResponse(200, updatedPost, "Post updated successfully"));

    } catch (error) {
      console.error("=== EDIT POST ERROR ===");
      console.error("Error updating post:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);

export const deletePost = asyncHandler(
  async (req: Request, res: Response) => {
    console.log('=== DELETE POST REQUEST START ===');
    console.log('Post ID:', req.params.postId);
    console.log('User:', { userId: req.user?.userId, companyId: req.user?.companyId });

    try {
      const companyId = req.user?.companyId;
      const postId = req.params.postId;

      if (!companyId) {
        console.log('ERROR: No company ID found');
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Unauthorized: Company not found"));
      }

      // Find the post to delete with user information
      const [existingPost] = await db
        .select({
          id: postTable.id,
          userId: postTable.userId,
          companyId: postTable.companyId,
          files: postTable.files,
          userRole: userTable.role,
        })
        .from(postTable)
        .innerJoin(userTable, eq(postTable.userId, userTable.userId))
        .where(
          and(
            eq(postTable.id, postId),
            eq(postTable.companyId, companyId)
          )
        );

      if (!existingPost) {
        console.log('ERROR: Post not found');
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Post not found"));
      }

      // Verify user has permission (post creator or admin)
      const isAdmin = req.user?.role === 'admin';
      const isAuthor = existingPost.userId === req.user?.userId;

      if (!isAdmin && !isAuthor) {
        console.log('ERROR: User not authorized to delete post');
        console.log('User role:', req.user?.role);
        console.log('Post author:', existingPost.userId);
        return res
          .status(403)
          .json(new ApiResponse(403, {}, "Not authorized to delete this post"));
      }

      // Delete associated files from R2
      const files = existingPost.files as PostFile[] || [];
      if (files.length > 0) {
        console.log('Deleting associated files:', files);
        const r2 = createR2Client();

        await Promise.all(files.map(async (file: PostFile) => {
          try {
            const fileName = file.url.split('/').pop();
            if (fileName) {
              await r2.send(
                new DeleteObjectCommand({
                  Bucket: process.env.BUCKET_NAME!,
                  Key: fileName,
                })
              );
              console.log(`Successfully deleted file: ${fileName}`);
            }
          } catch (error) {
            console.error(`Warning: Error deleting file from R2: ${file.url}`, error);
            // Continue with post deletion even if file deletion fails
          }
        }));
      }

      // Delete the post
      const [deletedPost] = await db
        .delete(postTable)
        .where(eq(postTable.id, postId))
        .returning();

      console.log('Post deleted successfully:', deletedPost);
      console.log('=== DELETE POST REQUEST END ===');

      return res
        .status(200)
        .json(new ApiResponse(200, deletedPost, "Post deleted successfully"));

    } catch (error) {
      console.error("=== DELETE POST ERROR ===");
      console.error("Error deleting post:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  }
);


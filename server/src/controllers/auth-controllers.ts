import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ApiResponse } from "../utils/api-response";
import { roleEnum, userTable } from "../db/schema/tbl-user";
import { sendVerificationEmail } from "../utils/send-verification-email";
import { generateVerificationCode } from "../utils/generate-verification-code";
import { generateExpiryDate } from "../utils/generate-verification-code";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { createR2Client } from "../utils/upload-r2";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import fs from 'fs/promises';

export const signup = asyncHandler(
  async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, companyId } = req.body;

    // Validate required fields
    if (
      [firstName, lastName, email, password, companyId].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      return res.status(400).json(new ApiResponse(400, {}, "All fields are required"));
    }

    // Check if the user already exists by email
    const existingUserByEmail = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password once for both cases
    const verifyCode = generateVerificationCode();
    const verifyCodeExpiry = generateExpiryDate();

    if (existingUserByEmail.length > 0) {
      const user = existingUserByEmail[0];

      // If the user is already verified, return an error
      if (user.isVerified) {
        res
          .status(400)
          .json(
            new ApiResponse(400, {}, "User already exists with this email")
          );
      }

      

      // If the user is not verified, update their details
      await db
        .update(userTable)
        .set({
          password: hashedPassword,
          verifyCode,
          verifyCodeExpiry,
        })
        .where(eq(userTable.email, email));

      // Send verification email
      const emailResponse = await sendVerificationEmail(
        email,
        firstName,
        verifyCode
      );

      if (!emailResponse.success) {
        res
          .status(500)
          .json(new ApiResponse(500, {}, "Failed to send verification email"));
      } 

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { email, firstName },
            "User details updated. Please verify your email."
          )
        );
    }

    // If no user exists, create a new user
    const newUser = {
      userId: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      companyId,
      verifyCode,
      verifyCodeExpiry,
      isVerified: false,
      role: "admin" as const,
    };

    await db.insert(userTable).values(newUser);

    // Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      firstName,
      verifyCode
    );

    if (!emailResponse.success) {
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Failed to send verification email"));
    } 

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { newUser },
          "User registered successfully. Please verify your email."
        )
      );
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
});





export const login = asyncHandler(
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

    if (!user || !user[0].isVerified || user[0].role !== "admin") {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "User not found or Not Verified or Not Admin"));
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return res.status(401).json(new ApiResponse(401, {}, "Invalid credentials"));
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
    return res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
});



export const logout = asyncHandler(
  async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, "Unauthorized request"));
    }
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS in production
      sameSite: "strict",
    });

    return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
  } catch (error) {
    console.log(error);
    return res.status(500).json(new ApiResponse(500, null, "Internal server error"));
  }
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const decodedEmail = decodeURIComponent(email);

    // Find the user by email
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, decodedEmail));

    if (user.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    const existingUser = user[0];

    // Check if the verification code and expiry are valid
    const isCodeValid = existingUser.verifyCode === code;

    // Handle null verifyCodeExpiry
    if (!existingUser.verifyCodeExpiry) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Verification code has expired. Please sign up again to get a new code."
          )
        );
    }

    const isCodeNotExpired = new Date(existingUser.verifyCodeExpiry) > new Date();

    if (isCodeValid && isCodeNotExpired) {
      // Update user's verification status
      await db
        .update(userTable)
        .set({ isVerified: true })
        .where(eq(userTable.email, decodedEmail));

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Account verified successfully"));
    } else if (!isCodeNotExpired) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Verification code has expired. Please sign up again to get a new code."
          )
        );
    } else {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Incorrect verification code"));
    }
  } catch (error) {
    console.error("Error verifying user:", error);
    return res.status(500).json(new ApiResponse(500, {}, "Error verifying user"));
  }
});

export const updateProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Ensure the authenticated user exists
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json(new ApiResponse(401, {}, 'Unauthorized: User is missing'));
    }


    const file = req.avatar;
   

    if (!file || !file.filepath) {
      return res.status(400).json(new ApiResponse(400, {}, 'No file uploaded or invalid file'));
    }

    // Create R2 client (S3-compatible client)
    const r2 = createR2Client();

    // Retrieve existing user from the database
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.userId, authUser.userId))
      .limit(1);

    if (!existingUser.length) {
      return res.status(404).json(new ApiResponse(404, {}, 'User not found'));
    }

    const existedUser = existingUser[0];

    // Delete previous profile picture from R2 if it exists
    if (existedUser.avatar) {
      const currentImageKey = existedUser.avatar.replace(`${process.env.PUBLIC_ACCESS_URL}/`, '');
      if (currentImageKey) {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME!,
            Key: currentImageKey,
          })
        );
      }
    }

    // Read the file from the temporary path
    const buffer = await fs.readFile(file.filepath);
    const uniqueFileName = `${nanoid()}-${encodeURIComponent(file.originalFilename || 'unnamed')}`;

    // Upload new profile picture to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      })
    );

    // Clean up the temporary file
    await fs.unlink(file.filepath);

    // Construct new profile picture URL
    const profileUrl = `${process.env.PUBLIC_ACCESS_URL}/${uniqueFileName}`;

    // Update the user record in the database
    await db
      .update(userTable)
      .set({ avatar: profileUrl })
      .where(eq(userTable.userId, authUser.userId))
      .execute();

    // Fetch updated user data
    const updatedUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.userId, authUser.userId))
      .limit(1);

    return res.status(200).json(
      new ApiResponse(200, updatedUser[0], 'Profile picture updated successfully')
    );
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res.status(401).json(new ApiResponse(401, {}, "Not authenticated"));
      }

      // Extract the fields from the request body
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json(new ApiResponse(400, {}, "Current password and new password are required"));
      }

      // Check if user exists and is verified
      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.userId, authUser.userId))
        .limit(1);

      if (!user.length || !user[0].isVerified) {
        return res.status(400).json(new ApiResponse(400, {}, "User does not exist or is not verified"));
      }

      const existingUser = user[0];

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isMatch) {
        return res.status(400).json(new ApiResponse(400, {}, "Current password is incorrect"));
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      await db
        .update(userTable)
        .set({ password: hashedPassword })
        .where(eq(userTable.userId, authUser.userId));

      return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully"));
    } catch (error) {
      console.error("Error updating password:", error);
      return res.status(500).json(new ApiResponse(500, {}, "Error updating password"));
    }
  }
);
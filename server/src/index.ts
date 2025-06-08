import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import company_router from "./routes/company-route";
import user_router from "./routes/auth-route";
import project_router from "./routes/project-route";
import employee_router from "./routes/employee-route";
import task_router from "./routes/task-route";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { messageTable } from "./db/schema";
import chat_router from "./routes/chat-route";
import bot_router from "./routes/bot-route";
import post_router from "./routes/post-route";


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger("dev"));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Mount user router
app.use("/api/auth", user_router);
app.use("/api/company", company_router);
app.use("/api/project", project_router);
app.use("/api/employee", employee_router);
app.use("/api/task", task_router);
app.use("/api/message", chat_router);
app.use("/api/ai-support", bot_router);
app.use("/api/post", post_router)

app.get("/", (req, res) => {
  res.send("Company & task server is running");
});

io.on("connection", (socket) => {
  socket.on("connect", () => {
    console.log("Socket connected", socket.id);
  });

  socket.on("joinProject", (projectId: string) => {
    console.log(`↪️  Client ${socket.id} requests joinProject(${projectId})`);
    socket.join(projectId);
    console.log(`📥 ${socket.id} joined room "${projectId}"`);
  });

  socket.on("sendMessage", async (data) => {
    const { projectId, content, senderId, avatar, firstName, lastName } = data;
    if (!projectId || !content.trim() || !senderId || !avatar || !firstName || !lastName) {
      socket.emit("messageError", { message: "Invalid message data." });
      return;
    }
    
    try {
      const newMessage = {
        id: uuidv4(),
        projectId,
        content,
        senderId,
        createdAt: new Date(), // ✅ Add timestamp
      };

      const [created] = await db
        .insert(messageTable)
        .values(newMessage)
        .returning();
      
      // 3) build the payload with nested sender
      const messageWithSender = {
        ...created,
        sender: {
          userId: senderId,
          firstName: firstName,
          lastName: lastName,
          avatar: avatar,
        },
      };

      io.to(projectId).emit("newMessage", messageWithSender); // ✅ Emit after insert
    } catch (err) {
      console.error("Error saving message:", err);
      socket.emit("messageError", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", socket.id, "| reason:", reason);
  });
});

// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log("App error -> ", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// catch all the unknown routes
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start the server
server.listen(process.env.PORT, () => {
  console.log("Server running on http://localhost:8000");
});

import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";
import dotenv from "dotenv";
import company_router from "./routes/company-route";
import user_router from "./routes/auth-route";
import project_router from "./routes/project-route";
import employee_router from "./routes/employee-route";
import task_router from "./routes/task-route";
dotenv.config();

const app = express();

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Mount user router
app.use("/api/auth", user_router);
app.use("/api/company", company_router);
app.use("/api/project", project_router);
app.use("/api/employee", employee_router);
app.use("/api/task", task_router);

app.get("/", (req, res) => {
  res.send("Company & task server is running");
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
app.listen(process.env.PORT, () => {
  console.log("Server running on http://localhost:8000");
});

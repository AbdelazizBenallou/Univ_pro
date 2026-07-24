import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import specs from "../framework/config/swagger.js";
import { env } from "../framework/config/env.js";
import { errorHandler } from "../framework/middleware/errorHandler.js";
import { notFound } from "../framework/middleware/notFound.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import { roleRoutes, permissionRoutes, userRoleRoutes } from "./modules/roles/roles.routes.js";
import fileRoutes from "./modules/files/files.routes.js";
import academicProgramRoutes from "./modules/academic-programs/academic-programs.routes.js";
import seasonRoutes from "./modules/seasons/seasons.routes.js";
import semesterRoutes from "./modules/semesters/semesters.routes.js";
import moduleRoutes from "./modules/modules/modules.routes.js";
import lessonFilesRoutes from "./modules/lesson-files/lesson-files.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscriptions.routes.js";


const app = express();

// HTTPS redirect
app.use((req, res, next) => {
  if (env.NODE_ENV === "production" && !req.secure && req.headers["x-forwarded-proto"] !== "https") {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }
  next();
});

// Core middleware
const corsOrigins = env.CORS_ORIGINS === "*" ? true : env.CORS_ORIGINS.split(",").map((s) => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(cookieParser());
app.use(express.json());

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/api-json", (_req, res) => res.json(specs));

// Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/users", userRoleRoutes);
app.use("/v1/roles", roleRoutes);
app.use("/v1/permissions", permissionRoutes);
app.use("/v1/files", fileRoutes);
app.use("/v1/academic-programs", academicProgramRoutes);
app.use("/v1/seasons", seasonRoutes);
app.use("/v1/semesters", semesterRoutes);
app.use("/v1/modules", moduleRoutes);
app.use("/v1/lesson-files", lessonFilesRoutes);
app.use("/v1/subscriptions", subscriptionRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;

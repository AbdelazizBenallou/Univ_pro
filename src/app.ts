import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import specs from "../framework/config/swagger.js";
import { env } from "../framework/config/env.js";
import { errorHandler } from "../framework/middleware/errorHandler.js";
import { notFound } from "../framework/middleware/notFound.js";
import { originCheck } from "../framework/middleware/originCheck.js";
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
import reviewRoutes from "./modules/reviews/reviews.routes.js";


const app = express();

// Trust first proxy hop so req.ip is reliable behind a reverse proxy (hardens rate limiting).
// Only in production: in dev the server is directly exposed, so trusting X-Forwarded-For would let clients spoof IPs.
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// HTTPS redirect
app.use((req, res, next) => {
  if (env.NODE_ENV === "production" && !req.secure && req.headers["x-forwarded-proto"] !== "https") {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }
  next();
});

// Security headers
app.use(helmet());

// Core middleware
const corsOrigins = env.CORS_ORIGINS === "*" ? true : env.CORS_ORIGINS.split(",").map((s) => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// CSRF / origin validation for state-changing requests
app.use(originCheck);

// Swagger docs (disabled in production unless SWAGGER_ENABLED=true)
if (env.SWAGGER_ENABLED) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.get("/api-json", (_req, res) => res.json(specs));
}

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
app.use("/v1/reviews", reviewRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;

import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  API_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default("*"),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth (JWT)
  ACCESS_SECRET: z.string().min(16),
  REFRESH_SECRET: z.string().min(16),
  ACCESS_EXPIRY: z.string().default("60m"),
  REFRESH_EXPIRY: z.string().default("7d"),

  // File upload
  UPLOAD_DIR: z.string().default("uploads"),
  UPLOAD_MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024),
  UPLOAD_MAX_AVATAR_SIZE: z.coerce.number().default(2 * 1024 * 1024),
  UPLOAD_MAX_VIDEO_SIZE: z.coerce.number().default(200 * 1024 * 1024),
  UPLOAD_MAX_BATCH_SIZE: z.coerce.number().default(20 * 1024 * 1024),
  MALWARE_SCANNER_ENABLED: z.coerce.boolean().default(true),

  // MinIO
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default("admin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin123"),
  MINIO_BUCKET: z.string().default("univ-pro-files"),
  MINIO_USE_SSL: z.string().default("false").transform((v) => v === "true" || v === "1"),
  MINIO_PUBLIC_URL: z.string().default("http://localhost:9000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

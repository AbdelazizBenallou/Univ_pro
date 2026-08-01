import app from "./app.js";
import { env } from "../framework/config/env.js";
import prisma from "../framework/config/prisma.js";
import logger from "../framework/config/logger.js";
import { connectRedis, disconnectRedis } from "../framework/config/redis.js";
import { ensureBucket } from "../framework/utils/minio.js";

const server = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("PostgreSQL connected");

    await connectRedis();

    try {
      await ensureBucket();
      logger.info("MinIO bucket ready");
    } catch (minioErr) {
      logger.error({ err: minioErr }, "MinIO init failed — continuing without MinIO");
    }

    app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Swagger docs: http://localhost:${env.PORT}/api-docs`);
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

const shutdown = async (): Promise<void> => {
  logger.info("Shutting down...");
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});

server();

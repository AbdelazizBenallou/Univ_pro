import * as Minio from "minio";
import { env } from "../config/env.js";

export const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
  useSSL: env.MINIO_USE_SSL,
});

export async function ensureBucket(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(env.MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(env.MINIO_BUCKET);
      console.log(`Bucket "${env.MINIO_BUCKET}" created`);
    }
  } catch (err) {
    console.error("MinIO bucket check failed:", err);
    throw err;
  }
}

export function buildMinioPath(params: {
  programName: string;
  levelName: string;
  seasonName: string;
  semesterName: string;
  moduleCode: string;
  activityTypeName: string;
  fileName: string;
  specialityCode?: string;
}): string {
  const { programName, levelName, seasonName, semesterName, moduleCode, activityTypeName, fileName, specialityCode } = params;
  let base = `${programName.toLowerCase()}/${levelName}`;
  if (specialityCode) base += `/${specialityCode}`;
  return `${base}/${seasonName}/${semesterName}/${moduleCode}/${activityTypeName}/${fileName}`;
}

import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import type { Request } from "express";
import { env } from "../config/env.js";

export const VALID_CATEGORIES = ["avatar", "document", "video", "other"];

export const MIMETYPE_MAP: Record<string, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"],
  video: ["video/mp4", "video/webm", "video/ogg"],
  other: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain"],
};

function getCategory(req: Request): string {
  return (req.query?.category as string) || (req.body?.category as string) || "other";
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${uuidv4()}${ext}`);
  },
});

const categoryOnlyFilter = (req: any, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const category = getCategory(req);
  if (!VALID_CATEGORIES.includes(category)) {
    cb(new Error(`Invalid category "${category}"`));
    return;
  }
  cb(null, true);
};

export const uploadBatch = multer({
  storage,
  fileFilter: categoryOnlyFilter,
  limits: {
    fileSize: env.UPLOAD_MAX_BATCH_SIZE,
  },
});

const lessonFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "application/rtf",
    "application/x-rtf",
    "text/rtf",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.mimetype === "application/octet-stream") {
    const ext = path.extname(file.originalname).toLowerCase();
    const extMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".csv": "text/csv",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".ogv": "video/ogg",
      ".rtf": "application/rtf",
    };
    if (extMap[ext]) {
      file.mimetype = extMap[ext];
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} (extension: ${ext}) not allowed`));
    }
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

export const lessonFileUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: lessonFileFilter,
  limits: { fileSize: env.UPLOAD_MAX_BATCH_SIZE },
});

export const lessonFileBatchUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: lessonFileFilter,
  limits: { fileSize: env.UPLOAD_MAX_BATCH_SIZE, files: 50 },
});

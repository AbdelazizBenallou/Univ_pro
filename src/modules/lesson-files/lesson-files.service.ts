import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import prisma from "../../../framework/config/prisma.js";
import { minioClient, minioPublicClient, buildMinioPath } from "../../../framework/utils/minio.js";
import { env } from "../../../framework/config/env.js";
import { AppError } from "../../../framework/utils/AppError.js";
import { parallelQueue } from "../../../framework/utils/queue.js";
import type { ListLessonFilesInput } from "./lesson-files.validator.js";
import type { AccessTokenPayload } from "../../../framework/utils/jwt.js";

export const lessonFilesService = {
  async findAll(input: ListLessonFilesInput, user: AccessTokenPayload) {
    const where: any = {
      module_id: input.module_id,
      activity_type_id: input.activity_type_id,
      season_id: input.season_id,
    };

    const roles = user.roles ?? [];
    if (!roles.includes("Super Admin") && !roles.includes("Admin")) {
      const profile = await prisma.profiles.findUnique({
        where: { user_id: user.userId },
        select: { level_id: true, speciality_id: true },
      });
      if (profile?.level_id) {
        where.modules = {
          semesters: { level_id: profile.level_id },
          ...(profile.speciality_id ? { speciality_id: profile.speciality_id } : {}),
        };
      }
    }

    const skip = (input.page - 1) * input.perPage;

    const [data, total] = await Promise.all([
      prisma.lesson_files.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          url: true,
          file_type: true,
          module_id: true,
          activity_type_id: true,
          season_id: true,
          uploaded_at: true,
          activity_types: { select: { name: true } },
        },
        skip,
        take: input.perPage,
        orderBy: { id: "asc" },
      }),
      prisma.lesson_files.count({ where }),
    ]);

    return {
      data: data.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        url: f.url,
        file_type: f.file_type,
        module_id: f.module_id,
        activity_type_id: f.activity_type_id,
        activity_type: f.activity_types.name,
        season_id: f.season_id,
        uploaded_at: f.uploaded_at,
      })),
      pagination: {
        page: input.page,
        perPage: input.perPage,
        total,
        totalPages: Math.ceil(total / input.perPage),
      },
    };
  },

  async upload(
    input: { module_id: number; activity_type_id: number; season_id: number; name: string; description?: string },
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const [module, activityType, season] = await Promise.all([
      prisma.modules.findUnique({
        where: { id: input.module_id },
        select: {
          code: true,
          specialities: { select: { code: true } },
          semesters: {
            select: { name: true, levels: { select: { name: true, academic_programs: { select: { name: true } } } } },
          },
        },
      }),
      prisma.activity_types.findUnique({ where: { id: input.activity_type_id }, select: { name: true } }),
      prisma.seasons.findUnique({ where: { id: input.season_id }, select: { name: true } }),
    ]);

    if (!module) throw new AppError("Module not found", 404);
    if (!activityType) throw new AppError("Activity type not found", 404);
    if (!season) throw new AppError("Season not found", 404);

    const ext = path.extname(file.originalname) || ".bin";
    const uuid = uuidv4();
    const fileName = `${uuid}${ext}`;

    const minioPath = buildMinioPath({
      programName: module.semesters.levels.academic_programs.name,
      levelName: module.semesters.levels.name,
      seasonName: season.name,
      semesterName: module.semesters.name,
      moduleCode: module.code,
      activityTypeName: activityType.name,
      fileName,
      specialityCode: module.specialities?.code ?? undefined,
    });

    const fileType = ext.replace(".", "").toLowerCase() || "bin";

    await minioClient.putObject(env.MINIO_BUCKET, minioPath, file.buffer);

    const lessonFile = await prisma.lesson_files.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        url: minioPath,
        file_type: fileType,
        module_id: input.module_id,
        activity_type_id: input.activity_type_id,
        season_id: input.season_id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        file_type: true,
        module_id: true,
        activity_type_id: true,
        season_id: true,
        uploaded_at: true,
        activity_types: { select: { name: true } },
      },
    });

    return lessonFile;
  },

  async uploadBatch(
    input: { module_id: number; activity_type_id: number; season_id: number },
    files: { buffer: Buffer; originalname: string; mimetype: string }[],
  ) {
    if (!files.length) throw new AppError("No files uploaded", 400);

    const [module, activityType, season] = await Promise.all([
      prisma.modules.findUnique({
        where: { id: input.module_id },
        select: {
          code: true,
          specialities: { select: { code: true } },
          semesters: {
            select: { name: true, levels: { select: { name: true, academic_programs: { select: { name: true } } } } },
          },
        },
      }),
      prisma.activity_types.findUnique({ where: { id: input.activity_type_id }, select: { name: true } }),
      prisma.seasons.findUnique({ where: { id: input.season_id }, select: { name: true } }),
    ]);

    if (!module) throw new AppError("Module not found", 404);
    if (!activityType) throw new AppError("Activity type not found", 404);
    if (!season) throw new AppError("Season not found", 404);

    const specialityCode = module.specialities?.code ?? undefined;

    const namesFromFiles = files.map((f) => path.parse(f.originalname).name);

    const existingRows = await prisma.lesson_files.findMany({
      where: {
        module_id: input.module_id,
        activity_type_id: input.activity_type_id,
        season_id: input.season_id,
        name: { in: namesFromFiles },
      },
      select: { name: true },
    });

    const existingNames = new Set(existingRows.map((r) => r.name));
    const skipped: { name: string; reason: string }[] = [];
    const candidates: { file: (typeof files)[number]; name: string; ext: string }[] = [];
    const seenInBatch = new Set<string>();

    for (const file of files) {
      const parsed = path.parse(file.originalname);
      const name = parsed.name;

      if (seenInBatch.has(name)) {
        skipped.push({ name, reason: "Duplicate in same batch" });
        continue;
      }
      seenInBatch.add(name);

      if (existingNames.has(name)) {
        skipped.push({ name, reason: "Already exists" });
        continue;
      }

      candidates.push({ file, name, ext: parsed.ext || ".bin" });
    }

    const { results, errors } = await parallelQueue(candidates, 5, async (candidate) => {
      const uuid = uuidv4();
      const fileName = `${uuid}${candidate.ext}`;

      const minioPath = buildMinioPath({
        programName: module.semesters.levels.academic_programs.name,
        levelName: module.semesters.levels.name,
        seasonName: season.name,
        semesterName: module.semesters.name,
        moduleCode: module.code,
        activityTypeName: activityType.name,
        fileName,
        specialityCode,
      });

      const fileType = candidate.ext.replace(".", "").toLowerCase() || "bin";

      await minioClient.putObject(env.MINIO_BUCKET, minioPath, candidate.file.buffer);

      const lessonFile = await prisma.lesson_files.create({
        data: {
          name: candidate.name,
          url: minioPath,
          file_type: fileType,
          module_id: input.module_id,
          activity_type_id: input.activity_type_id,
          season_id: input.season_id,
        },
        select: {
          id: true,
          name: true,
          url: true,
          file_type: true,
          module_id: true,
          activity_type_id: true,
          season_id: true,
          uploaded_at: true,
          activity_types: { select: { name: true } },
        },
      });

      return lessonFile;
    });

    const uploaded = results.filter(Boolean);

    for (const err of errors) {
      skipped.push({ name: candidates[err.index].name, reason: "Upload failed" });
    }

    return { uploaded, skipped };
  },

  async download(id: number, user: AccessTokenPayload) {
    const lessonFile = await prisma.lesson_files.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        file_type: true,
        modules: {
          select: {
            semester_id: true,
            speciality_id: true,
            semesters: { select: { level_id: true } },
          },
        },
      },
    });

    if (!lessonFile) throw new AppError("Lesson file not found", 404);

    const roles = user.roles ?? [];
    if (!roles.includes("Super Admin") && !roles.includes("Admin")) {
      const profile = await prisma.profiles.findUnique({
        where: { user_id: user.userId },
        select: { level_id: true, speciality_id: true },
      });

      if (profile?.level_id && lessonFile.modules.semesters.level_id !== profile.level_id) {
        throw new AppError("Lesson file not found", 404);
      }

      if (
        profile?.speciality_id &&
        lessonFile.modules.speciality_id &&
        lessonFile.modules.speciality_id !== profile.speciality_id
      ) {
        throw new AppError("Lesson file not found", 404);
      }
    }

    const presignedUrl = await minioPublicClient.presignedGetObject(env.MINIO_BUCKET, lessonFile.url, 3600);

    prisma.downloads.create({
      data: {
        user_id: user.userId,
        lesson_file_id: id,
      },
    }).catch((err) => console.error("Failed to track download:", err));

    return {
      id: lessonFile.id,
      name: lessonFile.name,
      file_type: lessonFile.file_type,
      download_url: presignedUrl,
      expires_in: 3600,
    };
  },

  async remove(id: number) {
    const lessonFile = await prisma.lesson_files.findUnique({
      where: { id },
      select: { id: true, url: true },
    });

    if (!lessonFile) throw new AppError("Lesson file not found", 404);

    await Promise.all([
      minioClient.removeObject(env.MINIO_BUCKET, lessonFile.url).catch((err: Error) => {
        console.error(`Failed to remove from MinIO: ${lessonFile.url}`, err);
      }),
      prisma.lesson_files.delete({ where: { id } }),
    ]);
  },
};

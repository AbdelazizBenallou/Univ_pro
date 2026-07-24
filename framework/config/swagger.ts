import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend API",
      version: "1.0.0",
      description: "Express + TypeScript + Prisma API",
    },
    servers: [
      {
        url: env.API_URL,
        description: "Development",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        LoginUser: {
          type: "object",
          properties: {
            id: { type: "integer" },
            email: { type: "string", format: "email" },
            status: { type: "string", enum: ["pending", "active", "blocked"] },
            roles: { type: "array", items: { type: "string" } },
            profile: {
              type: "object",
              properties: {
                first_name: { type: "string" },
                last_name: { type: "string" },
                student_id: { type: "string", nullable: true },
                phone: { type: "string", nullable: true },
                gender: { type: "string" },
                level: {
                  type: "object",
                  nullable: true,
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                  },
                },
                speciality: {
                  type: "object",
                  nullable: true,
                  properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    code: { type: "string" },
                  },
                },
              },
            },
          },
        },
        AcademicProgram: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            levels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                },
              },
            },
            specialities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  code: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "integer" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            phone: { type: "string", nullable: true },
            phone_provider: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                code: { type: "string" },
              },
            },
            date_of_birth: { type: "string", format: "date", nullable: true },
            gender: { type: "string", enum: ["Male", "Female"], nullable: true },
            address: { type: "string", nullable: true },
            student_id: { type: "string", nullable: true },
            avatar: { type: "string", nullable: true },
            level: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
              },
            },
            speciality: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                code: { type: "string", nullable: true },
              },
            },
            social_media_links: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  url: { type: "string" },
                },
              },
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.ts"],
};

const specs = swaggerJsdoc(options);
export default specs;

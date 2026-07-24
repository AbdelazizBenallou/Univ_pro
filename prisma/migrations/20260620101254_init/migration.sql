-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'locked', 'suspended');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_birth" DATE,
    "address" TEXT,
    "level_id" INTEGER,
    "specialization_id" INTEGER,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Role" (
    "role_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "permission_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "refresh_token_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("refresh_token_id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "login_history_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "login_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_at" TIMESTAMP(6),
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("login_history_id")
);

-- CreateTable
CREATE TABLE "DegreeLevel" (
    "degree_level_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DegreeLevel_pkey" PRIMARY KEY ("degree_level_id")
);

-- CreateTable
CREATE TABLE "Level" (
    "level_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "degree_level_id" INTEGER NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("level_id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "specialization_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("specialization_id")
);

-- CreateTable
CREATE TABLE "LevelSpecialization" (
    "level_id" INTEGER NOT NULL,
    "specialization_id" INTEGER NOT NULL,

    CONSTRAINT "LevelSpecialization_pkey" PRIMARY KEY ("level_id","specialization_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user" ON "RefreshToken"("user_id");

-- CreateIndex
CREATE INDEX "idx_login_history_user" ON "LoginHistory"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "DegreeLevel_name_key" ON "DegreeLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_name_key" ON "Specialization"("name");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "Specialization"("specialization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_degree_level_id_fkey" FOREIGN KEY ("degree_level_id") REFERENCES "DegreeLevel"("degree_level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSpecialization" ADD CONSTRAINT "LevelSpecialization_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelSpecialization" ADD CONSTRAINT "LevelSpecialization_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "Specialization"("specialization_id") ON DELETE CASCADE ON UPDATE CASCADE;

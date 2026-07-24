/*
  Warnings:

  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_user_id_fkey";

-- DropTable
DROP TABLE "PasswordResetToken";

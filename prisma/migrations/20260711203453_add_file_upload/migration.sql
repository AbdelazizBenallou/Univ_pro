-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatar_file_id" INTEGER;

-- CreateTable
CREATE TABLE "File" (
    "file_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("file_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_stored_name_key" ON "File"("stored_name");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "File"("file_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop rating check constraint
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_rating_check";

-- Drop rating column
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "rating";

-- Make comment required
ALTER TABLE "reviews" ALTER COLUMN "comment" SET NOT NULL;

-- Enforce one review per user
CREATE UNIQUE INDEX "reviews_user_id_key" ON "reviews"("user_id");

-- Allow multiple reviews per user: drop unique constraint on user_id
DROP INDEX IF EXISTS "reviews_user_id_key";

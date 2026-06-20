-- Add scope column to Community table
-- PUBLIC = visible/searchable by all users
-- PRIVATE = invite-only, not shown in search results

ALTER TABLE "Community" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'PUBLIC';

-- Migration: remove ownership_documents column from landlords table
ALTER TABLE "landlords" DROP COLUMN IF EXISTS "ownership_documents";

-- ============================================================================
-- Rollback: 013_positions_source_fk_rollback
-- ============================================================================

DROP INDEX IF EXISTS idx_positions_source;
ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "positions_sourceId_fkey";
ALTER TABLE "positions" DROP COLUMN IF EXISTS "sourceId";

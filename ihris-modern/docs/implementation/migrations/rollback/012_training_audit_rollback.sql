-- ============================================================================
-- Rollback: 012_training_audit_rollback
-- ============================================================================

DROP INDEX IF EXISTS idx_training_audit_changed_at;
DROP INDEX IF EXISTS idx_training_audit_action;
DROP INDEX IF EXISTS idx_training_audit_entity;
DROP TABLE IF EXISTS "training_audit_log";

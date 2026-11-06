-- ============================================================================
-- Rollback: التراجع عن 003_user_active_flag
-- يقابل: migrations/pending/003_user_active_flag.sql
-- التاريخ: 06 نوفمبر 2026
-- ============================================================================

BEGIN;

-- إعادة قيد التدقيق إلى قيمه السابقة.
-- NOT VALID: لا نفحص الصفوف القديمة، حتى لا يفشل التراجع إذا وُجدت
-- صفوف deactivate/activate تاريخية (نحافظ على سجل التدقيق ولا نحذفه).
ALTER TABLE user_audit_log DROP CONSTRAINT IF EXISTS user_audit_log_action_check;
ALTER TABLE user_audit_log
    ADD CONSTRAINT user_audit_log_action_check
    CHECK (action IN ('create', 'update', 'delete', 'restore')) NOT VALID;

DROP INDEX IF EXISTS idx_users_is_active_deleted_at;
ALTER TABLE "users" DROP COLUMN IF EXISTS "isActive";

COMMIT;

-- ملاحظات:
-- 1. idempotent: إعادة التنفيذ لا تُسبب خطأ.
-- 2. لا يحذف أي صف من user_audit_log.

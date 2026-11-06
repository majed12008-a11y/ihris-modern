-- ============================================================================
-- Rollback: التراجع عن Soft Delete + Optimistic Lock + Audit Log
-- يقابل: migrations/pending/002_user_soft_delete_and_audit.sql
-- التاريخ: 05 نوفمبر 2026
-- الحالة: غير منفَّذ (ملف فقط؛ يُستخدم عند التراجع الكامل عن GAP-002/003)
-- ============================================================================

BEGIN;

-- حذف جدول التدقيق وفهارسه (CASCADE يغطي الفهارس المرتبطة)
DROP TABLE IF EXISTS user_audit_log CASCADE;

-- حذف فهرس المحذوفين
DROP INDEX IF EXISTS idx_users_deleted_at;

-- حذف أعمدة Soft Delete / version بالترتيب العكسي
ALTER TABLE "users" DROP COLUMN IF EXISTS "restoredAt";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deletionReason";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deletedBy";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "users" DROP COLUMN IF EXISTS "version";

COMMIT;

-- ملاحظات:
-- 1. الأوامر idempotent: إعادة التنفيذ لا تُسبب خطأ.
-- 2. هذا الملف يحذف بيانات التدقيق؛ يُستخدم فقط عند التراجع الكامل.
-- 3. لا يمسّ أي جدول آخر (user_access / report_* تبقى كما هي).

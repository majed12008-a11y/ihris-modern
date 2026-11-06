-- ============================================================================
-- Rollback: التراجع عن 005_facility_version_and_audit
-- يقابل: migrations/pending/005_facility_version_and_audit.sql
-- التاريخ: 06 نوفمبر 2026
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS facility_audit_log CASCADE;
ALTER TABLE "facilities" DROP COLUMN IF EXISTS "version";

COMMIT;

-- ملاحظات:
-- 1. idempotent.
-- 2. يحذف سجل التدقيق؛ يُستخدم فقط عند التراجع الكامل عن Sprint 3.
-- 3. لا يمسّ جدول positions أو أي جدول مرجعي.

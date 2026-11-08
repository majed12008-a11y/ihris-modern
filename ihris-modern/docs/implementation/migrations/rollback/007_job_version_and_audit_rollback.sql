-- ============================================================================
-- Rollback: 007_job_version_and_audit
-- الغرض: التراجع عن Sprint 4 (المسميات الوظيفية)
-- التاريخ: 08 نوفمبر 2026
-- ============================================================================
-- تنويه: حذف job_audit_log يفقد سجل التدقيق. لا يُنفَّذ في الإنتاج إلا بقرار.
-- ============================================================================

DROP TABLE IF EXISTS job_audit_log;
DROP INDEX IF EXISTS idx_jobs_code;
DROP INDEX IF EXISTS idx_jobs_title;
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "version";

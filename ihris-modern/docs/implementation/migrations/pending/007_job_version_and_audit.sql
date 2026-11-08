-- ============================================================================
-- Migration: 007_job_version_and_audit
-- الغرض: Sprint 4 — ADR-007 (بيانات مرجعية): قفل تفاؤلي + تدقيق للمسميات الوظيفية
-- التاريخ: 08 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (للإنتاج: pending)
-- ============================================================================
-- ملاحظات التصميم:
-- 1. version للقفل التفاؤلي في تعديل المسمى الوظيفي (409 عند التعارض).
-- 2. job_audit_log بلا FOREIGN KEY على jobs عمداً: الحذف فيزيائي
--    ويجب أن يبقى سجل التدقيق بعد الحذف.
-- 3. لا UNIQUE على jobs.title أو jobs.code في DB: التفرّد يُفرض في التطبيق
--    (لا دليل على UNIQUE في hippo_job).
-- 4. جميع الأوامر idempotent.
-- ============================================================================

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS job_audit_log (
    id SERIAL PRIMARY KEY,
    "jobId" INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "changedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "oldValues" JSONB,
    "newValues" JSONB,
    reason TEXT
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'job_audit_log_action_check'
    ) THEN
        ALTER TABLE job_audit_log
            ADD CONSTRAINT job_audit_log_action_check
            CHECK (action IN ('create', 'update', 'delete'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_audit_log_job_changed
    ON job_audit_log ("jobId", "changedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_job_audit_log_action
    ON job_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_job_audit_log_changed_at
    ON job_audit_log ("changedAt");

-- فهارس بحث (البحث بالعنوان/الكود)
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs (title);
CREATE INDEX IF NOT EXISTS idx_jobs_code ON jobs (code);

-- --------------------------------------------------------
-- ملاحظات:
-- 1. لا Soft Delete للمسميات: الحذف فيزيائي بعد التأكد من عدم وجود positions (422).
-- 2. version يزداد بمقدار 1 مع كل PUT ناجح.
-- --------------------------------------------------------

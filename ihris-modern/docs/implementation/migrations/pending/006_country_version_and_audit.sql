-- ============================================================================
-- Migration: 006_country_version_and_audit
-- الغرض: Sprint 4 — ADR-007 (بيانات مرجعية): قفل تفاؤلي + تدقيق للدول
-- التاريخ: 08 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (للإنتاج: pending)
-- ============================================================================
-- ملاحظات التصميم:
-- 1. version للقفل التفاؤلي في تعديل الدولة (409 عند التعارض).
-- 2. country_audit_log بلا FOREIGN KEY على countries عمداً: الحذف فيزيائي
--    ويجب أن يبقى سجل التدقيق بعد الحذف (مثل user_audit_log / facility_audit_log).
-- 3. لا أعمدة جديدة غير version (لا iso_code — لا دليل في النظام القديم).
-- 4. جميع الأوامر idempotent.
-- ============================================================================

ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS country_audit_log (
    id SERIAL PRIMARY KEY,
    "countryId" INTEGER NOT NULL,
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
        SELECT 1 FROM pg_constraint WHERE conname = 'country_audit_log_action_check'
    ) THEN
        ALTER TABLE country_audit_log
            ADD CONSTRAINT country_audit_log_action_check
            CHECK (action IN ('create', 'update', 'delete'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_country_audit_log_country_changed
    ON country_audit_log ("countryId", "changedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_country_audit_log_action
    ON country_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_country_audit_log_changed_at
    ON country_audit_log ("changedAt");

-- --------------------------------------------------------
-- ملاحظات:
-- 1. لا Soft Delete للدول: الحذف فيزيائي بعد التأكد من عدم وجود مراجع (422).
-- 2. version يزداد بمقدار 1 مع كل PUT ناجح.
-- --------------------------------------------------------

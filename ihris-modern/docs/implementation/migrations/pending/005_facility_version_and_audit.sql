-- ============================================================================
-- Migration: 005_facility_version_and_audit
-- الغرض: Sprint 3 — دعم ADR-006 (قفل تفاؤلي + تدقيق) لإدارة المنشآت
-- التاريخ: 06 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (للإنتاج: pending)
-- ============================================================================
-- ملاحظات التصميم:
-- 1. version للقفل التفاؤلي في تعديل المنشأة (409 عند التعارض).
-- 2. facility_audit_log بلا FOREIGN KEY على facilities عمداً: الحذف فيزيائي
--    (Hard Delete) ويجب أن يبقى سجل التدقيق بعد الحذف (مثل user_audit_log).
-- 3. لا تُضاف أعمدة جديدة غير version (لا code — انظر BLK-010).
-- 4. جميع الأوامر idempotent.
-- ============================================================================

ALTER TABLE "facilities" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS facility_audit_log (
    id SERIAL PRIMARY KEY,
    "facilityId" INTEGER NOT NULL,
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
        SELECT 1 FROM pg_constraint WHERE conname = 'facility_audit_log_action_check'
    ) THEN
        ALTER TABLE facility_audit_log
            ADD CONSTRAINT facility_audit_log_action_check
            CHECK (action IN ('create', 'update', 'delete'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_facility_audit_log_facility_changed
    ON facility_audit_log ("facilityId", "changedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_facility_audit_log_action
    ON facility_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_facility_audit_log_changed_at
    ON facility_audit_log ("changedAt");

-- --------------------------------------------------------
-- ملاحظات:
-- 1. لا Soft Delete للمنشآت: الحذف فيزيائي بعد التأكد من عدم وجود positions.
-- 2. version يزداد بمقدار 1 مع كل PUT ناجح.
-- --------------------------------------------------------

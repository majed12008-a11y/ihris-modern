-- ============================================================================
-- Migration: 009_reference_data_audit
-- الغرض: Sprint 5 / ADR-008 — جدول تدقيق موحّد للبيانات المرجعية
-- التاريخ: 08 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (للإنتاج: pending)
-- ============================================================================
-- ملاحظات التصميم:
-- 1. جدول واحد لكل الجداول الخمسة بدل خمسة جداول: entityType + entityId.
-- 2. بلا FOREIGN KEY عمداً: الحذف فيزيائي ويجب أن يبقى سجل التدقيق بعده.
-- 3. جميع الأوامر idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS reference_data_audit_log (
    id SERIAL PRIMARY KEY,
    "entityType" VARCHAR(40) NOT NULL,
    "entityId" INTEGER NOT NULL,
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
        SELECT 1 FROM pg_constraint WHERE conname = 'reference_data_audit_log_action_check'
    ) THEN
        ALTER TABLE reference_data_audit_log
            ADD CONSTRAINT reference_data_audit_log_action_check
            CHECK (action IN ('create', 'update', 'delete'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reference_data_audit_log_entity_check'
    ) THEN
        ALTER TABLE reference_data_audit_log
            ADD CONSTRAINT reference_data_audit_log_entity_check
            CHECK ("entityType" IN (
                'salary_grade', 'cadre', 'classification',
                'position_type', 'salary_source'
            ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reference_audit_entity
    ON reference_data_audit_log ("entityType", "entityId", "changedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_reference_audit_action
    ON reference_data_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_reference_audit_changed_at
    ON reference_data_audit_log ("changedAt");

-- ----------------------------------------------------------------
-- ملاحظات:
-- 1. entityType محصور بـCHECK لخمس قيم — يمنع أخطاء التسمية.
-- 2. entityId ليس FK لأن الجداول مختلفة ويجب أن يبقى السجل بعد الحذف.
-- ----------------------------------------------------------------

-- ============================================================================
-- Migration: 012_training_audit
-- الغرض: Sprint 6 / ADR-009 — سجل تدقيق موحّد لكل كيانات التدريب
-- التاريخ: 14 نوفمبر 2026
-- الحالة: pending
-- ============================================================================
-- لماذا جدول موحّد؟
--   الكيانات (دورة/مؤسسة/دورة مجدولة/تسجيل) تتشارك نفس بنية الحدث. جدول واحد
--   بـ(entityType, entityId) يبسّط الاستعلام ويقلل الجداول، كما في ADR-008.
--   لا FK على الكيانات عمداً: يبقى السجل بعد الحذف (hard delete للمؤسسة).
-- ============================================================================

CREATE TABLE IF NOT EXISTS "training_audit_log" (
  id            SERIAL PRIMARY KEY,
  "entityType"  VARCHAR(40) NOT NULL,
  "entityId"    INTEGER NOT NULL,
  action        VARCHAR(20) NOT NULL,
  "changedBy"   INTEGER NOT NULL,
  "changedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "oldValues"   JSONB,
  "newValues"   JSONB,
  reason        TEXT
);

CREATE INDEX IF NOT EXISTS idx_training_audit_entity
  ON "training_audit_log" ("entityType", "entityId", "changedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_training_audit_action
  ON "training_audit_log" (action);
CREATE INDEX IF NOT EXISTS idx_training_audit_changed_at
  ON "training_audit_log" ("changedAt");

-- للتراجع: rollback/012_training_audit_rollback.sql

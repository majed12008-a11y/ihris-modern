-- ============================================================================
-- Migration: 013_positions_source_fk
-- الغرض: Sprint 6 / ADR-009 §9.2 (8) — تحويل positions.source إلى FK حقيقي
-- التاريخ: 14 نوفمبر 2026
-- الحالة: pending
-- ============================================================================
-- السياق:
--   `positions.source` كان VARCHAR(100) نصاً حراً. القديم (hippo_position.source)
--   يخزّن معرّفات salary_source كنصوص ('69','71','72','73')، و992 من 999 صفاً NULL.
--   لا نحذف العمود النصي (توافق/ترحيل)، بل نضيف sourceId صحيحاً مع FK.
--
-- لماذا ON DELETE RESTRICT؟
--   BR: لا يمكن حذف salary_source مستخدم في position → 422. القيد يعطي شبكة
--   أمان حتى لو فشل العدّ التطبيقي.
-- ============================================================================

ALTER TABLE "positions" ADD COLUMN IF NOT EXISTS "sourceId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positions_sourceId_fkey'
  ) THEN
    ALTER TABLE "positions"
      ADD CONSTRAINT "positions_sourceId_fkey"
      FOREIGN KEY ("sourceId") REFERENCES "salary_sources" (id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_positions_source ON "positions" ("sourceId");

-- ترحيل اختياري للبيانات النصية الرقمية الموجودة (لا يمسّ النصوص غير الرقمية):
UPDATE "positions"
SET "sourceId" = NULLIF(regexp_replace("source", '\D', '', 'g'), '')::INTEGER
WHERE "sourceId" IS NULL
  AND "source" ~ '^\s*\d+\s*$'
  AND EXISTS (
    SELECT 1 FROM "salary_sources" s
    WHERE s.id = NULLIF(regexp_replace("positions"."source", '\D', '', 'g'), '')::INTEGER
  );

-- للتراجع: rollback/013_positions_source_fk_rollback.sql

-- ============================================================================
-- Migration: 008_reference_data_schema
-- الغرض: Sprint 5 / ADR-008 — توسيع الجداول المرجعية الخمسة
-- التاريخ: 08 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (للإنتاج: pending)
-- ============================================================================
-- ملاحظات التصميم:
-- 1. توسيع مطابق لبنية القديم (hippo_*): لا اختراع أعمدة مالية.
--    start/end/midpoint في hippo_salary_grade نصية وكلها NULL فعلياً،
--    لذا تُضاف كـVARCHAR NULL بنفس الأسماء الدلالية.
-- 2. code يُضاف لأربعة جداول (لا يوجد كود في القديم) لتمكين البحث والتفرّد
--    وإمكانية ON CONFLICT في الـseed.
-- 3. salary_sources جدول جديد بالكامل (لا يقابله جدول في المخطط الحديث).
-- 4. version لكل جدول — قفل تفاؤلي مطابق لـADR-007.
-- 5. جميع الأوامر idempotent.
-- ============================================================================

-- ---------------------------------------------------------------- salary_grades
ALTER TABLE "salary_grades" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);
ALTER TABLE "salary_grades" ADD COLUMN IF NOT EXISTS "startSalary" VARCHAR(255);
ALTER TABLE "salary_grades" ADD COLUMN IF NOT EXISTS "endSalary" VARCHAR(255);
ALTER TABLE "salary_grades" ADD COLUMN IF NOT EXISTS "midpointSalary" VARCHAR(255);
ALTER TABLE "salary_grades" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "salary_grades" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "salary_grades" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_grades_code
    ON "salary_grades" ("code");
CREATE INDEX IF NOT EXISTS idx_salary_grades_name ON "salary_grades" (name);

-- ---------------------------------------------------------------- cadres
ALTER TABLE "cadres" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);
ALTER TABLE "cadres" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "cadres" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cadres_code
    ON "cadres" ("code");
CREATE INDEX IF NOT EXISTS idx_cadres_name ON "cadres" (name);

-- ---------------------------------------------------------------- classifications
ALTER TABLE "classifications" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_classifications_code
    ON "classifications" ("code");
CREATE INDEX IF NOT EXISTS idx_classifications_name ON "classifications" (name);

-- ---------------------------------------------------------------- position_types
ALTER TABLE "position_types" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);
ALTER TABLE "position_types" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "position_types" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_position_types_code
    ON "position_types" ("code");
CREATE INDEX IF NOT EXISTS idx_position_types_name ON "position_types" (name);

-- ---------------------------------------------------------------- salary_sources (جديد)
CREATE TABLE IF NOT EXISTS salary_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50),
    description TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_sources_code
    ON salary_sources (code);

-- ----------------------------------------------------------------
-- ملاحظات:
-- 1. لا Soft Delete لأي جدول مرجعي — الحذف فيزيائي بعد عدّ المراجع (422).
-- 2. version يزداد بمقدار 1 مع كل PUT ناجح.
-- 3. salary_sources بلا FK من positions.source عمداً (انظر ADR-008 §8.5).
-- ----------------------------------------------------------------

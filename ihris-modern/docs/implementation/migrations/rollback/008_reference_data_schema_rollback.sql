-- ============================================================================
-- Rollback: 008_reference_data_schema
-- الغرض: التراجع عن توسيع الجداول المرجعية الخمسة
-- التاريخ: 08 نوفمبر 2026
-- ============================================================================
-- تنويه: حذف الأعمدة يفقد أي بيانات أُدخلت فيها (code/description/version…).
-- لا يُنفَّذ في الإنتاج إلا بعد rollback الـseed (010) وبقرار.
-- ============================================================================

DROP TABLE IF EXISTS salary_sources;

DROP INDEX IF EXISTS idx_position_types_name;
DROP INDEX IF EXISTS idx_position_types_code;
ALTER TABLE "position_types" DROP COLUMN IF EXISTS "version";
ALTER TABLE "position_types" DROP COLUMN IF EXISTS "description";
ALTER TABLE "position_types" DROP COLUMN IF EXISTS "code";

DROP INDEX IF EXISTS idx_classifications_name;
DROP INDEX IF EXISTS idx_classifications_code;
ALTER TABLE "classifications" DROP COLUMN IF EXISTS "version";

DROP INDEX IF EXISTS idx_cadres_name;
DROP INDEX IF EXISTS idx_cadres_code;
ALTER TABLE "cadres" DROP COLUMN IF EXISTS "version";
ALTER TABLE "cadres" DROP COLUMN IF EXISTS "description";
ALTER TABLE "cadres" DROP COLUMN IF EXISTS "code";

DROP INDEX IF EXISTS idx_salary_grades_name;
DROP INDEX IF EXISTS idx_salary_grades_code;
ALTER TABLE "salary_grades" DROP COLUMN IF EXISTS "version";
ALTER TABLE "salary_grades" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "salary_grades" DROP COLUMN IF EXISTS "description";
ALTER TABLE "salary_grades" DROP COLUMN IF EXISTS "midpointSalary";
ALTER TABLE "salary_grades" DROP COLUMN IF EXISTS "endSalary";
ALTER TABLE "salary_grades" DROP COLUMN IF EXISTS "startSalary";
ALTER TABLE "salary_grades" DROP COLUMN IF EXISTS "code";

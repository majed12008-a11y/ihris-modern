-- ============================================================================
-- Migration: 011_training_schema
-- الغرض: Sprint 6 / ADR-009 — تحصين مخطط التدريب للـCRUD والقفل التفاؤلي
-- التاريخ: 14 نوفمبر 2026
-- الحالة: pending (يُطبَّق على ihris_test_gap001 أثناء التطوير فقط)
-- ============================================================================
-- ملاحظات التصميم:
-- 1. النماذج موجودة مسبقاً في schema.prisma؛ هذه الترحيل تضيف فقط ما يلزم
--    للـCRUD الآمن: version + soft delete + status سير العمل.
-- 2. الحالات المرجعية (training_course_statuses) تبقى FACT من القديم
--    (Open/Closed). حالة سير العمل للدورة المجدولة عمود مستقل مشتق من
--    BR-075..078 (planning|scheduled|completed|cancelled).
-- 3. جميع الأوامر idempotent (IF NOT EXISTS / DO blocks).
-- ============================================================================

-- ---------------------------------------------------------------- training_courses
ALTER TABLE "training_courses" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "training_courses" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "training_courses" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_training_courses_name ON "training_courses" ("name");
CREATE INDEX IF NOT EXISTS idx_training_courses_deleted_at ON "training_courses" ("deletedAt");
CREATE INDEX IF NOT EXISTS idx_training_courses_institution ON "training_courses" ("trainingInstitutionId");
CREATE INDEX IF NOT EXISTS idx_training_courses_status ON "training_courses" ("trainingCourseStatusId");

-- ---------------------------------------------------------------- training_institutions
ALTER TABLE "training_institutions" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "training_institutions" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------- scheduled_training_courses
ALTER TABLE "scheduled_training_courses" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled';
ALTER TABLE "scheduled_training_courses" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "scheduled_training_courses" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_training_courses_status_check'
  ) THEN
    ALTER TABLE "scheduled_training_courses"
      ADD CONSTRAINT scheduled_training_courses_status_check
      CHECK ("status" IN ('planning', 'scheduled', 'completed', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scheduled_training_courses_course
  ON "scheduled_training_courses" ("trainingCourseId");
CREATE INDEX IF NOT EXISTS idx_scheduled_training_courses_status
  ON "scheduled_training_courses" ("status");
CREATE INDEX IF NOT EXISTS idx_scheduled_training_courses_start
  ON "scheduled_training_courses" ("startDate");

-- ---------------------------------------------------------------- person_scheduled_training_courses
-- فهرس يسرّع عدّ المتدربين ومنع حذف الدورة المجدولة المرتبطة.
CREATE INDEX IF NOT EXISTS idx_person_scheduled_training_course
  ON "person_scheduled_training_courses" ("scheduledTrainingCourseId");
CREATE INDEX IF NOT EXISTS idx_person_scheduled_person
  ON "person_scheduled_training_courses" ("personId");

-- ----------------------------------------------------------------
-- ملاحظات:
-- 1. soft delete للدورات فقط (deletedAt). المؤسسات تُحذف فيزيائياً بعد عدّ المراجع.
-- 2. version يزداد +1 مع كل PUT ناجح؛ updateMany({id, version}) → 409.
-- 3. status ليس مرجعاً خارجياً — قيمة مقيدة بـCHECK مشتقة من وثائق القديم.
-- 4. للتراجع: rollback/011_training_schema_rollback.sql
-- ----------------------------------------------------------------

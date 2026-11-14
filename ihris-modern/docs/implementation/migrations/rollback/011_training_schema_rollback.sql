-- ============================================================================
-- Rollback: 011_training_schema_rollback
-- يعكس 011_training_schema.sql (لا يمسّ البيانات).
-- ============================================================================

DROP INDEX IF EXISTS idx_person_scheduled_person;
DROP INDEX IF EXISTS idx_person_scheduled_training_course;
DROP INDEX IF EXISTS idx_scheduled_training_courses_start;
DROP INDEX IF EXISTS idx_scheduled_training_courses_status;
DROP INDEX IF EXISTS idx_scheduled_training_courses_course;

ALTER TABLE "scheduled_training_courses"
  DROP CONSTRAINT IF EXISTS scheduled_training_courses_status_check;
ALTER TABLE "scheduled_training_courses" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "scheduled_training_courses" DROP COLUMN IF EXISTS "version";
ALTER TABLE "scheduled_training_courses" DROP COLUMN IF EXISTS "status";

ALTER TABLE "training_institutions" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "training_institutions" DROP COLUMN IF EXISTS "version";

DROP INDEX IF EXISTS idx_training_courses_status;
DROP INDEX IF EXISTS idx_training_courses_institution;
DROP INDEX IF EXISTS idx_training_courses_deleted_at;
DROP INDEX IF EXISTS idx_training_courses_name;

ALTER TABLE "training_courses" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "training_courses" DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "training_courses" DROP COLUMN IF EXISTS "version";

-- ============================================================================
-- Rollback: 014_seed_training_rollback
-- يحذف صفوف الـSeed بالمعرّفات القديمة فقط (لا TRUNCATE، لا مساس بصفوف يدوية).
-- ============================================================================

DELETE FROM "person_scheduled_training_courses" WHERE id IN (15384, 15393);
DELETE FROM "scheduled_training_courses" WHERE id IN (15378, 15415, 15419);
DELETE FROM "training_courses" WHERE id IN (15377, 15414, 15418);
DELETE FROM "training_course_categories" WHERE id IN (15374, 15417, 15420, 15421, 15422);
DELETE FROM "training_course_statuses" WHERE id IN (15375, 15376);
DELETE FROM "training_institutions" WHERE id IN (15401, 15403, 15405);

SELECT setval(pg_get_serial_sequence('training_institutions', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM training_institutions), 1));
SELECT setval(pg_get_serial_sequence('training_course_statuses', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM training_course_statuses), 1));
SELECT setval(pg_get_serial_sequence('training_course_categories', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM training_course_categories), 1));
SELECT setval(pg_get_serial_sequence('training_courses', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM training_courses), 1));
SELECT setval(pg_get_serial_sequence('scheduled_training_courses', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM scheduled_training_courses), 1));
SELECT setval(pg_get_serial_sequence('person_scheduled_training_courses', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 1) FROM person_scheduled_training_courses), 1));

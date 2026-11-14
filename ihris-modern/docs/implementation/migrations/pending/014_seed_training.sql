-- ============================================================================
-- Migration: 014_seed_training
-- الغرض: Sprint 6 / ADR-009 §9.3 — Seed تدريب واقعي من DB export.sql (FACT)
-- التاريخ: 14 نوفمبر 2026
-- الحالة: pending — لا يُطبَّق على الإنتاج
-- ============================================================================
-- المصدر: DB export.sql — قسم ihris_manage
--   training_institutions           56713–56716  (3 صفوف)
--   training_course_statuses        56662–56664  (2 صفوف)
--   training_course_categories      56559–56564  (5 صفوف)
--   training_courses                56535–56538  (3 صفوف)
--   scheduled_training_courses      56484–56487  (3 صفوف)
--   person_scheduled_training_courses 54205–54207 (2 صفوف — مشروطة)
-- الإجمالي المُطبَّق على قاعدة الاختبار: 16 صفاً (صفّا التسجيل مؤجّلان).
--
-- مستويات الثقة:
--   FACT = كل الأسماء/التواريخ/الأرقام منقولة حرفياً.
--   DERIVED = status='scheduled' للدورات المجدولة (العمود جديد؛ القديم بلا حالة
--             على مستوى الدورة المجدولة). لا تُخترع تواريخ أو أسماء.
--
-- ⚠️ لا تُعدَّل صفوف موجودة — INSERT فقط + ON CONFLICT (id) DO NOTHING.
-- ⚠️ المعرّفات القديمة محفوظة صريحة لتبقى العلاقات صحيحة.
-- ⚠️ countryId/districtId (9/41/55) محفوظة كما في القديم؛ لا FK للجغرافيا هنا.
-- ============================================================================

-- ---------------------------------------------------------------- institutions
INSERT INTO "training_institutions" (id, name) VALUES
  (15401, 'Baisl School'),
  (15403, 'Caecheaje School'),
  (15405, 'Caifrael School')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- statuses
INSERT INTO "training_course_statuses" (id, name) VALUES
  (15375, 'Open'),
  (15376, 'Closed')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- categories
INSERT INTO "training_course_categories" (id, name) VALUES
  (15374, 'HIV/AIDS'),
  (15417, 'Maternal Health'),
  (15420, 'Infection Control'),
  (15421, 'Neonatal Care'),
  (15422, 'Laboratory')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- courses
INSERT INTO "training_courses"
  (id, name, topic, notes, "trainingInstitutionId", "trainingFunder",
   "continuingEducationCourse", "trainingCourseStatusId",
   "trainingCourseCategoryId", competency)
VALUES
  (15377, 'HIV/AIDS Counseling', 'Counseling', NULL, NULL, NULL, NULL, 15375, 15374, '163'),
  (15414, 'HIV/AIDS Patient Counseling', 'Counseling', NULL, 15403, '15407', '15400', 15375, 15374, NULL),
  (15418, 'Postnatal Care for Nurses', 'Postnatal Care', NULL, 15401, '15407', '15416', 15375, 15417, '174')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- scheduled courses
INSERT INTO "scheduled_training_courses"
  (id, "trainingCourseId", site, "numStudents", notes, instructors,
   "startDate", "endDate", "countryId", "districtId", "countyId", status)
VALUES
  (15378, 15377, 'Capital City University', 15, NULL, NULL,
   TIMESTAMP '2008-08-14 00:00:00', TIMESTAMP '2008-08-17 00:00:00', 9, 41, NULL, 'scheduled'),
  (15415, 15414, 'Capital City University', 50, NULL, NULL,
   TIMESTAMP '2008-12-17 00:00:00', TIMESTAMP '2008-12-20 00:00:00', 9, 41, NULL, 'scheduled'),
  (15419, 15418, 'Baisl School', 65, NULL, 'Ms. Janine Brown',
   TIMESTAMP '2009-04-10 00:00:00', TIMESTAMP '2009-04-17 00:00:00', 9, 55, NULL, 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- enrollments (conditional)
-- الصفّان القديمان يشيران إلى الشخصين 10341 و15385. قاعدة الاختبار الحديثة
-- لا تحوي people بعد (0 صف)، لذا يُدرج الصف فقط عند وجود الشخص.
INSERT INTO "person_scheduled_training_courses"
  (id, "personId", "scheduledTrainingCourseId", "isRetraining", completed,
   "requestDate", notes, "trainingCourseEvaluationId",
   "trainingCourseRequestorId", "trainingCourseId")
SELECT 15384, 10341, 15378, false, false,
       TIMESTAMP '2008-08-14 00:00:00', NULL, 15381, NULL, 15377
WHERE EXISTS (SELECT 1 FROM people WHERE id = 10341)
  AND EXISTS (SELECT 1 FROM scheduled_training_courses WHERE id = 15378)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "person_scheduled_training_courses"
  (id, "personId", "scheduledTrainingCourseId", "isRetraining", completed,
   "requestDate", notes, "trainingCourseEvaluationId",
   "trainingCourseRequestorId", "trainingCourseId")
SELECT 15393, 15385, 15378, false, false,
       TIMESTAMP '2008-08-14 00:00:00', NULL, 15381, NULL, 15377
WHERE EXISTS (SELECT 1 FROM people WHERE id = 15385)
  AND EXISTS (SELECT 1 FROM scheduled_training_courses WHERE id = 15378)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------- sequences
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

-- للتراجع: rollback/014_seed_training_rollback.sql

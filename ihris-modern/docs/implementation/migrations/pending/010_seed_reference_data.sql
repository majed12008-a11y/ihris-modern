-- ============================================================================
-- Migration: 010_seed_reference_data
-- الغرض: Sprint 5 / ADR-008 (§8.3) — بيانات مرجعية واقعية من DB export.sql
-- التاريخ: 08 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (للإنتاج: pending)
-- ============================================================================
-- المصدر: DB export.sql — قاعدة `ihris_manage` (السطور 1–100,054):
--   salary_grades     → 56422–56427   (5 صفوف)
--   cadres            → 50199–50203   (4 صفوف)
--   classifications   → 50226–50232   (6 صفوف)
--   position_types    → 55315–55319   (4 صفوف)
--   salary_sources    → 56448–56455   (7 صفوف)
-- الإجمالي: 26 صفاً — كلها FACT (نصوص حرفية من القديم).
--
-- levels of confidence:
--   FACT    = الاسم/الوصف/الملاحظات منقولة حرفياً من DB export.sql
--   DERIVED = code مشتق (القديم لا يحوي كوداً لـ4 جداول)
--
-- ⚠️ لا تعديل على بيانات موجودة — INSERT فقط + ON CONFLICT (code) DO NOTHING.
-- ⚠️ لا صفوف تقديرية (ESTIMATE = 0): البيانات الفعلية موجودة ومتاحة.
-- التوثيق صفاً بصف: docs/implementation/migrations/seeds/README.md
-- ============================================================================

-- ---------------------------------------------------------------- salary_grades
INSERT INTO "salary_grades" (name, code, notes, description) VALUES
  ('Entry-Level', 'SG-01',
   'Entry-level and support positions.',
   'الدرجة الابتدائية — وظائف المبتدئين ووظائف الدعم [ترجمة]'),
  ('Professional Entry-Level', 'SG-02',
   'Professional first grade.',
   'الدرجة المهنية الأولى [ترجمة]'),
  ('Professional Mid-Level/Managerial', 'SG-03',
   NULL,
   'الدرجة المهنية المتوسطة / الإدارية [ترجمة]'),
  ('Specialist/Director', 'SG-04',
   NULL,
   'درجة الأخصائي / المدير [ترجمة]'),
  ('Technical Specialist', 'SG-05',
   'Not included in any standard salary grades.',
   'أخصائي فني — غير مشمول بأي درجة معيارية [ترجمة]')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- cadres
INSERT INTO "cadres" (name, code, description) VALUES
  ('Medical Doctor', 'CAD-MD', 'طبيب بشري [ترجمة]'),
  ('Nurse', 'CAD-NUR', 'ممرض [ترجمة]'),
  ('Allied Health Professional', 'CAD-AHP', 'أخصائي صحي مساند [ترجمة]'),
  ('Pharmacist', 'CAD-PHA', 'صيدلي [ترجمة]')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- classifications
-- الأكواد 222/223/322/241/411 منقولة حرفياً (رموز ISCO في القديم).
-- كود Pharmacist مشتق (كان NULL في القديم).
INSERT INTO "classifications" (name, description, code) VALUES
  ('Medical Doctor', 'Medical doctors', '222'),
  ('Nurse', 'Nursing and midwifery professionals', '223'),
  ('Allied Health Professional', 'Modern health associate professionals (except nursing)', '322'),
  ('Non-Health Professional', 'Professionals, not health', '241'),
  ('Non-Health Support Staff', 'Support staff, not health-related', '411'),
  ('Pharmacist', 'Dispenses drugs.', 'PHA')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- position_types
INSERT INTO "position_types" (name, code, description) VALUES
  ('Permanent Full-Time', 'PT-PERM-FT', 'دائم بدوام كامل [ترجمة]'),
  ('Permanent Part-Time', 'PT-PERM-PT', 'دائم بدوام جزئي [ترجمة]'),
  ('Temporary Hourly', 'PT-TEMP-HR', 'مؤقت بالساعة [ترجمة]'),
  ('Consultant', 'PT-CONS', 'استشاري [ترجمة]')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------- salary_sources
INSERT INTO salary_sources (name, code, description) VALUES
  ('Private Non-profit (NGO)', 'SRC-NGO', 'منظمة غير ربحية خاصة [ترجمة]'),
  ('Private For-profit (Commercial)', 'SRC-COMM', 'قطاع خاص تجاري [ترجمة]'),
  ('Individual Donor', 'SRC-IND', 'متبرع فردي [ترجمة]'),
  ('Faith-based Organization (FBO)', 'SRC-FBO', 'منظمة دينية [ترجمة]'),
  ('Association', 'SRC-ASSOC', 'جمعية [ترجمة]'),
  ('Ministry of Health', 'SRC-MOH', 'وزارة الصحة [ترجمة]'),
  ('Private', 'SRC-PRIV', 'قطاع خاص [ترجمة]')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------
-- ملاحظات:
-- 1. الأسماء إنجليزية حرفياً كما في `ihris_manage` (لتفادي التكرار عند ترحيل
--    البيانات القديمة مستقبلاً). الترجمة العربية في description مع وسم [ترجمة].
-- 2. `startSalary`/`endSalary`/`midpointSalary` تبقى NULL: القديم لا يحوي قيماً.
-- 3. للتراجع: rollback/010_seed_reference_data_rollback.sql (DELETE WHERE code IN ...).
-- ----------------------------------------------------------------

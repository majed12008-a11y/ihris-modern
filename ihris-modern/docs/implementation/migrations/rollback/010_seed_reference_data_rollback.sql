-- ============================================================================
-- Rollback: 010_seed_reference_data
-- الغرض: حذف الصفوف الـ26 المدرجة في الـseed فقط
-- التاريخ: 08 نوفمبر 2026
-- ============================================================================
-- تنويه: الحذف بـcode IN (...) — لا TRUNCATE، ولا مساس بأي صف أُدخل يدوياً
-- أو بكود مختلف. إذا كان صفاً seeded مستخدماً في job، يفشل الحذف بـFK
-- (jobs.salaryGradeId/cadreId/classificationId) — وهذا مقصود.
-- ============================================================================

DELETE FROM "salary_grades" WHERE code IN ('SG-01','SG-02','SG-03','SG-04','SG-05');
DELETE FROM "cadres"        WHERE code IN ('CAD-MD','CAD-NUR','CAD-AHP','CAD-PHA');
DELETE FROM "classifications"
 WHERE code IN ('222','223','322','241','411','PHA');
DELETE FROM "position_types" WHERE code IN ('PT-PERM-FT','PT-PERM-PT','PT-TEMP-HR','PT-CONS');
DELETE FROM salary_sources   WHERE code IN ('SRC-NGO','SRC-COMM','SRC-IND','SRC-FBO','SRC-ASSOC','SRC-MOH','SRC-PRIV');

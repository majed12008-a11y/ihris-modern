-- ============================================================================
-- Rollback: التراجع عن جداول نظام التقارير المخصص
-- يقابل: migrations/pending/001_create_report_tables.sql
-- التاريخ: 04 نوفمبر 2026
-- الحالة: غير منفَّذ (ملف فقط)
-- ============================================================================

BEGIN;

-- الحذف بالترتيب العكسي للإنشاء لاحترام المفاتيح الخارجية
DROP TABLE IF EXISTS report_preferences CASCADE;
DROP TABLE IF EXISTS report_executions CASCADE;
DROP TABLE IF EXISTS report_definitions CASCADE;

COMMIT;

-- ملاحظات:
-- 1. CASCADE يضمن نجاح التراجع حتى لو بقيت كائنات تابعة.
-- 2. الأوامر idempotent: إعادة التنفيذ لا تُسبب خطأ.
-- 3. هذا الملف يحذف البيانات؛ يُستخدم فقط عند التراجع الكامل عن GAP-001.

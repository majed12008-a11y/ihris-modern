-- ============================================================================
-- Migration: إنشاء جداول نظام التقارير المخصص (Custom Reports)
-- الغرض: دعم نظام التقارير المخصص لـ iHRIS Modern
-- التاريخ: 04 نوفمبر 2026
-- الحالة: معلقة (لم يتم التنفيذ على قاعدة البيانات)
-- ============================================================================

-- --------------------------------------------------------
-- جدول تعريفات التقارير (report_definitions)
-- يخزن تعريفات التقارير المخصصة التي ينشئها المستخدمون
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'list',
    definition JSONB NOT NULL, -- تعريف التقرير بصيغة JSON (الحقول، العلاقات، الفلاتر، أنواع العرض)
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT NOT NULL REFERENCES "users"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_definitions_name ON report_definitions(name);
CREATE INDEX IF NOT EXISTS idx_report_definitions_created_by ON report_definitions(created_by);
CREATE INDEX IF NOT EXISTS idx_report_definitions_is_enabled ON report_definitions(is_enabled);

-- --------------------------------------------------------
-- جدول سجل تنفيذ التقارير (report_executions)
-- يخزن نتائج تنفيذ التقارير وسجل العمليات
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_executions (
    id SERIAL PRIMARY KEY,
    report_definition_id INT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    executed_by INT NOT NULL REFERENCES "users"(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    result JSONB, -- نتائج التقرير بصيغة JSON
    error_message TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    row_count INT DEFAULT 0,
    execution_time_ms INT
);

CREATE INDEX IF NOT EXISTS idx_report_executions_report_definition_id ON report_executions(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_by ON report_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_started_at ON report_executions(started_at);

-- --------------------------------------------------------
-- جدول تفضيلات التقارير للمستخدمين (report_preferences)
-- يخزن تفضيلات كل المستخدمين للتقارير (التقارير المفضلة، الإعدادات الشخصية)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    report_definition_id INT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    custom_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_preferences_user_report ON report_preferences(user_id, report_definition_id);

-- --------------------------------------------------------
-- ملاحظات:
-- 1. جميع الجداول تستخدم معرفات تلقائية (SERIAL)
-- 2. جميع العلاقات تستخدم Foreign Keys مع حذف متسلسل (ON DELETE CASCADE)
-- 3. جميع الجداول تحتوي على حقول timestamps (created_at, updated_at)
-- 4. تم إضافة فهارس لتحسين أداء الاستعلامات الشائعة
-- 5. جدول report_definitions يستخدم عمود JSONB لتعريف التقارير، مما يتيح المرونة في إضافة حقول جديدة
-- --------------------------------------------------------
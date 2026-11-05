-- ============================================================================
-- Migration: إنشاء جداول نظام التقارير المخصص (Custom Reports)
-- الغرض: دعم نظام التقارير المخصص لـ iHRIS Modern
-- التاريخ: 04 نوفمبر 2026 | تصحيح الأعمدة: 05 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (انظر migrations/applied/README.md)
-- ============================================================================
-- ملاحظة تصحيحية (Sprint 1.5b):
-- النسخة السابقة استخدمت snake_case (is_enabled, created_by, ...) بينما مخطط
-- Prisma لا يستخدم @map، أي أن الأعمدة المتوقعة هي camelCase (isEnabled,
-- createdBy, ...). التطابق مع الجداول الحالية (users.createdAt, users.creatorId)
-- يقتضي camelCase. لذلك أُعيدت كتابة الأعمدة بأسماء camelCase بين علامات تنصيص.
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
    definition JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdBy" INT NOT NULL REFERENCES "users"(id),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_definitions_name ON report_definitions(name);
CREATE INDEX IF NOT EXISTS idx_report_definitions_created_by ON report_definitions("createdBy");
CREATE INDEX IF NOT EXISTS idx_report_definitions_is_enabled ON report_definitions("isEnabled");

-- --------------------------------------------------------
-- جدول سجل تنفيذ التقارير (report_executions)
-- يخزن نتائج تنفيذ التقارير وسجل العمليات
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_executions (
    id SERIAL PRIMARY KEY,
    "reportDefinitionId" INT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    "executedBy" INT NOT NULL REFERENCES "users"(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    result JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP,
    "rowCount" INT DEFAULT 0,
    "executionTimeMs" INT
);

CREATE INDEX IF NOT EXISTS idx_report_executions_report_definition_id ON report_executions("reportDefinitionId");
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_by ON report_executions("executedBy");
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_started_at ON report_executions("startedAt");

-- --------------------------------------------------------
-- جدول تفضيلات التقارير للمستخدمين (report_preferences)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_preferences (
    id SERIAL PRIMARY KEY,
    "userId" INT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    "reportDefinitionId" INT NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    "isFavorite" BOOLEAN NOT NULL DEFAULT FALSE,
    "customSettings" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_preferences_user_report ON report_preferences("userId", "reportDefinitionId");

-- --------------------------------------------------------
-- ملاحظات:
-- 1. جميع الجداول تستخدم معرفات تلقائية (SERIAL)
-- 2. العلاقات تستخدم Foreign Keys مع ON DELETE CASCADE حيث يلزم
-- 3. الأعمدة camelCase مطابقة لمخطط Prisma (بدون @map)
-- 4. كل الأوامر idempotent (IF NOT EXISTS)
-- --------------------------------------------------------

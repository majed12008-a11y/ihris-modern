-- ============================================================================
-- Migration: Soft Delete + Optimistic Lock + Audit Log للمستخدمين
-- الغرض: تنفيذ ADR-003 لـ GAP-002 (تعديل مستخدم) وGAP-003 (حذف مستخدم)
-- التاريخ: 05 نوفمبر 2026
-- الحالة: مطبَّق على ihris_test_gap001 فقط (للإنتاج: pending)
-- ============================================================================
-- ملاحظات التصميم:
-- 1. أسماء الأعمدة camelCase مطابقة لمخطط Prisma الحالي (بدون @map)، على نمط
--    users.createdAt وusers.creatorId.
-- 2. جميع الأوامر idempotent (IF NOT EXISTS / DO block).
-- 3. user_audit_log بلا FOREIGN KEY على users عمداً: يجب أن يبقى سجل التدقيق
--    بعد أي purge نهائي مستقبلي (P3).
-- 4. لا تُكتب كلمة المرور أو hashها في oldValues/newValues مطلقاً (قاعدة تطبيق).
-- ============================================================================

-- --------------------------------------------------------
-- 1) أعمدة Soft Delete + Optimistic Lock على users
-- --------------------------------------------------------
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedBy" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "restoredAt" TIMESTAMP;

-- فهرس البحث عن المحذوفين (القائمة الافتراضية تستثنيهم)
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON "users" ("deletedAt");

-- --------------------------------------------------------
-- 2) جدول سجل التدقيق user_audit_log
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_audit_log (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "changedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "oldValues" JSONB,
    "newValues" JSONB,
    reason TEXT
);

-- قيد القيم المسموحة للأفعال (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_audit_log_action_check'
    ) THEN
        ALTER TABLE user_audit_log
            ADD CONSTRAINT user_audit_log_action_check
            CHECK (action IN ('create', 'update', 'delete', 'restore'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_changed
    ON user_audit_log ("userId", "changedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action
    ON user_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_changed_at
    ON user_audit_log ("changedAt");

-- --------------------------------------------------------
-- ملاحظات:
-- 1. حذف المستخدم = تعيين deletedAt/deletedBy/deletionReason (لا DELETE فيزيائي).
-- 2. الاستعادة = تصفير deletedAt/deletedBy/deletionReason + تعيين restoredAt.
-- 3. version يزداد بمقدار 1 مع كل PUT/DELETE/restore ناجح.
-- 4. القيود الحالية NO ACTION على report_definitions.createdBy و
--    report_executions.executedBy تُستخدم كشبكة أمان (الخيار B).
-- --------------------------------------------------------

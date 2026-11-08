# أدلة GAP-003 — حذف/استعادة مستخدم

## 1. الملفات والترحيلات

| الملف | النوع | الغرض |
|-------|-------|-------|
| `docs/implementation/migrations/pending/002_user_soft_delete_and_audit.sql` | جديد | 5 أعمدة + فهرس + `user_audit_log` + 3 فهارس + CHECK |
| `docs/implementation/migrations/rollback/002_user_soft_delete_and_audit_rollback.sql` | جديد | تراجع كامل idempotent |
| `backend/prisma/schema.prisma` | معدّل | حقول soft delete/version + `UserAuditLog` |
| `backend/src/services/user.service.ts` | معدّل | `softDelete`, `restore`, `listDeleted`, `relatedRecordCounts` |
| `backend/src/services/auth.service.ts` | معدّل | منع دخول المستخدم المحذوف (401) |
| `backend/src/routes/user.ts` | معدّل | `DELETE /:id`, `POST /:id/restore`, `GET /deleted` |
| `frontend/src/pages/DeletedUsers.tsx` | جديد | قائمة المحذوفين + استعادة + عدّاد الأيام |
| `frontend/src/pages/Users.tsx` | معدّل | Modal حذف + سبب إلزامي |
| `frontend/src/App.tsx` | معدّل | مسار `users/deleted` |

## 2. بنية قاعدة البيانات بعد الترحيل

```sql
-- users
version        INTEGER NOT NULL DEFAULT 1
deletedAt      TIMESTAMP NULL
deletedBy      INTEGER NULL
deletionReason TEXT NULL
restoredAt     TIMESTAMP NULL
-- index: idx_users_deleted_at

-- user_audit_log
id SERIAL PK
userId INTEGER NOT NULL
action VARCHAR(20) NOT NULL CHECK (action IN ('create','update','delete','restore'))
changedBy INTEGER NOT NULL
changedAt TIMESTAMP NOT NULL DEFAULT NOW()
oldValues JSONB NULL
newValues JSONB NULL
reason TEXT NULL
-- indexes: (userId, changedAt DESC), (action), (changedAt)
```

## 3. أدلة الترحيل

| الخطوة | النتيجة |
|--------|---------|
| تطبيق أول | ✅ `ALTER TABLE` ×5 + `CREATE INDEX` + `CREATE TABLE` + `DO` + 3 فهارس |
| تطبيق ثانٍ (idempotency) | ✅ NOTICE "already exists, skipping" فقط |
| Rollback | ✅ `DROP TABLE`, `DROP INDEX`, `ALTER TABLE DROP COLUMN` ×5 |
| إعادة تطبيق بعد rollback | ✅ نجح |
| `ihris_manage` | ❌ لم تُمسّ (كل الأوامر على `ihris_test_gap001`) |

## 4. دليل الحذف المنطقي (استعلام فعلي)

```sql
SELECT id, username, "deletedAt", "deletedBy", "deletionReason", version
FROM users WHERE username LIKE 'gap2%';
```

النتيجة بعد سيناريو 6:
- `deletedAt` غير NULL
- `deletedBy = admin.id`
- `deletionReason = 'حساب تجريبي لم يعد مطلوباً'`
- `version` ازداد بمقدار 1
- الصف **موجود** (لم يُحذف فيزيائياً)

## 5. دليل رفض الحذف لصاحب سجلات

```json
// DELETE /api/users/:id  (لديه reportDefinition)
// 422
{
  "error": "لا يمكن حذف المستخدم: لديه 1 سجل مرتبط (تعريفات تقارير: 1، تنفيذات تقارير: 0). عطّل الحساب بدلاً من حذفه للحفاظ على سجلات العمل.",
  "code": "UNPROCESSABLE_ENTITY"
}
```

وبقي `deletedAt = NULL` للمستخدم، وبقي صف `report_definitions` سليماً.

## 6. دليل الاستعادة

| الحالة | النتيجة |
|--------|---------|
| خلال 30 يوماً | 200، `restoredAt` مضبوط، `deletedAt = NULL`، audit `restore` |
| بعد 40 يوماً | 422 "انتهت فترة الاستعادة (30 يوماً)" |

## 7. دليل SQL Injection

المدخل: `x'; DROP TABLE "users"; --` كـ`deletion_reason`.

- الاستجابة: 200 مع نفس النص في `deletionReason`.
- قاعدة البيانات: النص مخزّن حرفياً، و`users` ما زال موجوداً (`count > 0`).
- Audit: `reason` مطابق حرفياً.
- السبب: Prisma parameterized queries — لا دمج نصي.

## 8. دليل منع الدخول

```
POST /api/auth/login  { username: "gap2del3", password: "Passw0rd!" }
→ 401 { "error": "Invalid username or password" }
```

(رسالة عامة لا تكشف أن الحساب محذوف.)

## 9. نتائج التشغيل

```
Test Suites: 9 passed, 9 total
Tests:       73 passed, 73 total
```

منها: 12 سيناريو قبول + 10 أمان + 9 وحدة + 42 انحدار سابق.

## 10. قيود موثقة

- لا يوجد Purge بعد 90 يوماً (P3).
- ~~لا يوجد حقل `isActive` مستقل (BLK-008).~~ **أُغلق في Sprint 2.5** — انظر `gaps/GAP-002/README.md` و`user.lifecycle.test.ts`.
- `user_log` القديم (login/logout/activity) مفقود (BLK-007 / RISK-013) — خارج نطاق Sprint 2.

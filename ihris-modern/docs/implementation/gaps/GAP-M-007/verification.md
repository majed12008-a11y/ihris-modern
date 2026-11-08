# GAP-M-007 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `admin` يحذف مسمى بلا مراجع | 200 + `success:true` + اختفاء الصف + بقاء سجل `delete` | ✅ مطابق |
| 2 | حذف مسمى مرتبط بوظيفة شاغرة | 422 + `details.positionsCount > 0` + بقاء المسمى و`jobId` | ✅ مطابق |
| 3 | `hr_manager` يحاول الحذف | 403 (الحذف admin فقط) | ✅ مطابق |
| 4 | `hr_staff` يحاول الحذف | 403 + بقاء الصف | ✅ مطابق (`job.security.test.ts` S7) |
| 5 | حذف بلا توكن | 401 | ✅ مطابق (middleware) |
| 6 | حذف معرّف غير موجود | 404 | ✅ مطابق |

## التحقق اليدوي
```sql
-- بعد حذف ناجح
SELECT count(*) FROM jobs WHERE id = <id>;                 -- 0
SELECT action FROM job_audit_log WHERE "jobId" = <id>;      -- create, delete
-- بعد محاولة حذف مرتبط
SELECT count(*) FROM positions WHERE "jobId" = <id>;        -- > 0 (لم تتغير)
```

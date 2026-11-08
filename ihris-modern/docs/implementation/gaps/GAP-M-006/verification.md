# GAP-M-006 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `admin` يعدّل العنوان بـ`version` الصحيح | 200 + العنوان الجديد + `version+1` + audit `update` | ✅ مطابق |
| 2 | تعديل بـ`version+5` | 409 + بقاء العنوان و`version` الأصليين في DB | ✅ مطابق (`job.security.test.ts` S6) |
| 3 | تعديل إلى عنوان موجود | 409 | ✅ مطابق (فحص التفرّد عند تغيّر العنوان) |
| 4 | `PUT` بلا `version` | 400 | ✅ مطابق (`job.validation.test.ts` 4) |
| 5 | `PUT` بـ`{version:1}` فقط | 400 «لا توجد حقول للتعديل» | ✅ مطابق (نفس الاختبار) |
| 6 | ضبط `salaryGradeId: null` | 200 وفصل المرجع | ✅ مطابق (nullable في المخطط) |
| 7 | `hr_staff` يحاول التعديل | 403 | ✅ مطابق (RBAC) |
| 8 | مسمى غير موجود | 404 | ✅ مطابق |

## التحقق اليدوي
```sql
SELECT action, "oldValues"->>'title' AS old_title, "newValues"->>'title' AS new_title
FROM job_audit_log WHERE action = 'update' ORDER BY id DESC LIMIT 1;
```

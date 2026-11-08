# GAP-M-009 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `hr_manager` يعدّل اسماً بـ`version` الصحيح | 200 + الاسم الجديد + `version+1` + صف `update` بـ`changedBy=manager.id` | ✅ مطابق |
| 2 | تعديل بـ`version` خاطئ | 409 ولا تُكتب القيمة (لا تغيير في DB) | ✅ مطابق (`job.security.test.ts` S6 للمسار المماثل) |
| 3 | تعديل إلى اسم دولة أخرى | 409 | ✅ مطابق (فحص التفرّد مُستدعى عند تغيّر الاسم) |
| 4 | `PUT` بلا `version` | 400 | ✅ مطابق (`country.validation.test.ts` 4) |
| 5 | `PUT` بجسم `{}` أو `{version}` فقط | 400 | ✅ مطابق (نفس الاختبار) |
| 6 | `hr_staff` يحاول التعديل | 403 | ✅ مطابق (RBAC على المسار) |
| 7 | دولة غير موجودة | 404 | ✅ مطابق (notFound) |

## التحقق اليدوي
```sql
SELECT action, "oldValues"->>'name' AS old_name, "newValues"->>'name' AS new_name,
       "newValues"->>'version' AS new_version
FROM country_audit_log WHERE action = 'update' ORDER BY id DESC LIMIT 1;
```

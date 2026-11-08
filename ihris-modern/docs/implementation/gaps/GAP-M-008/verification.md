# GAP-M-008 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `admin` → `POST /api/countries` باسم جديد | 201 + `id` + `version=1` + صف `create` في `country_audit_log` بـ`changedBy=admin.id` | ✅ مطابق |
| 2 | `hr_staff` → نفس النقطة | 403 ولا يُنشأ صف | ✅ مطابق |
| 3 | إنشاء بنفس الاسم مرتين | 201 ثم 409 برسالة «توجد دولة أخرى بنفس الاسم» | ✅ مطابق |
| 4 | `POST` مع `id`/`version` في الجسم | 400 + `code: VALIDATION_ERROR` + «حقل غير مسموح» | ✅ مطابق (`country.security.test.ts` S3) |
| 5 | `POST` مع كائن/ملف في `name` | 400 | ✅ مطابق (S4) |
| 6 | `POST` بلا توكن | 401 | ✅ مطابق (S2، على `DELETE`) |

## التحقق اليدوي
```sql
SELECT action, "changedBy" FROM country_audit_log ORDER BY id DESC LIMIT 1;
-- create | <admin id>
```

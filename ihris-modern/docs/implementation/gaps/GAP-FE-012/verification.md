# GAP-FE-012 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `admin` → `DELETE` درجة غير مستخدمة | 200 `{success:true}` ثم `GET` → 404 | ✅ مطابق (`reference.test.ts`) |
| 2 | `DELETE` درجة مستخدمة في job | 422 + `details.وظائف=1` | ✅ مطابق (`reference.test.ts` سيناريو 22) |
| 3 | `DELETE` بلا توثيق | 401 | ✅ مطابق (`reference.security.test.ts` S5) |
| 4 | `hr_manager` → `DELETE` | 403 | ✅ مطابق (`reference.extra.test.ts` S6) |
| 5 | `DELETE` غير موجود | 404 | ✅ مطابق (`reference.service`) |
| 6 | التحقق من سجل التدقيق بعد الحذف | `create`→`update`→`delete` | ✅ مطابق (`reference.extra.test.ts` S10) |

## الأثر
الحذف فيزيائي؛ سجل التدقيق يبقى لأنه بلا FK. تحذير الواجهة يوضح أن الحذف
غير ممكن إذا كان السجل مرتبطاً بوظيفة أو منصب.

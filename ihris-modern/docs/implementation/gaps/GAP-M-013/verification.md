# GAP-M-013 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `POST /api/reference/classifications` | 201 + `version=1` + audit | ✅ مطابق (`reference.test.ts`) |
| 2 | `GET` بالاسم/الكود | 200 | ✅ مطابق |
| 3 | `PUT` + `version` صحيح | 200 + `version=2` | ✅ مطابق |
| 4 | `DELETE` (admin) | 200 ثم 404 | ✅ مطابق |
| 5 | `DELETE` تصنيف مستخدم في job | 422 | ✅ مطابق (`reference.service` usage) |
| 6 | `hr_staff` قراءة القائمة | 200 | ✅ مطابق (`reference.security.test.ts` S9) |
| 7 | `hr_staff` تعديل | 403 | ✅ مطابق (`reference.security.test.ts` S10) |
| 8 | Seed | 6 صفوف (5 ISCO + `PHA`) | ✅ مطابق |

## البيانات
أكواد 222/223/322/241/411 أصلية من القديم؛ `PHA` مشتق لأن كود Pharmacist كان `NULL`.

# GAP-M-014 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `POST /api/reference/position-types` | 201 + audit | ✅ مطابق (`reference.test.ts`) |
| 2 | `GET` + بحث | 200 | ✅ مطابق |
| 3 | `PUT` + `version` | 200 + `version=2` | ✅ مطابق |
| 4 | `DELETE` نوع غير مستخدم | 200 ثم 404 | ✅ مطابق |
| 5 | `DELETE` نوع مرتبط بمنصب | 422 + `details.مناصب=1` | ✅ مطابق (`reference.extra.test.ts` S9) |
| 6 | `POST` بحقل غير معروف | 400 | ✅ مطابق (`reference.security.test.ts` S1) |
| 7 | Seed | 4 صفوف `PT-*` | ✅ مطابق |

## ملاحظة تصميم
الجدول هو نفسه `JobType` (`position_types`)؛ أُضيفت إليه `code`/`description`/`version`
دون إنشاء جدول جديد، حفاظاً على علاقة `positions.posTypeId` القائمة.

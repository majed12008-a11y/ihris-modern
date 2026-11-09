# GAP-FE-010 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `hr_manager` → `POST /api/reference/salary-grades` باسم وكود جديدين | 201 + `version=1` + audit `create` | ✅ مطابق (`reference.test.ts`) |
| 2 | نفس الاسم بحالة أحرف مختلفة | 409 ولا صف جديد | ✅ مطابق (`reference.extra.test.ts` S1) |
| 3 | نفس الكود بحالة أحرف مختلفة | 409 | ✅ مطابق (`reference.extra.test.ts` S2) |
| 4 | `POST` مع `id`/`version`/`role` في الجسم | 400 «حقل غير مسموح» | ✅ مطابق (`reference.security.test.ts` S1) |
| 5 | `hr_staff` → `POST` | 403 | ✅ مطابق (`reference.test.ts` كتلة الفئة/الأمان) |
| 6 | حقل `startSalary` بطول 256 | 400 | ✅ مطابق (`reference.validation.test.ts`) |

## ملاحظة
الصفوف الفعلية موجودة مسبقاً من الـSeed (SG-01..SG-05)؛ الاختبارات تُنشئ صفوفاً
بادئة `gap5r` وتنظّفها، ولا تمسّ صفوف الـSeed.

# GAP-M-012 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `POST /api/reference/cadres` | 201 + audit `create` | ✅ مطابق (`reference.test.ts`) |
| 2 | `GET` قائمة + بحث بالاسم | 200 + الصف | ✅ مطابق |
| 3 | `PUT` + `version=1` | 200 + `version=2` | ✅ مطابق |
| 4 | `DELETE` (admin) | 200 ثم 404 | ✅ مطابق |
| 5 | `DELETE` فئة مستخدمة في job | 422 + `details.وظائف` | ✅ مطابق (`reference.service` usage) |
| 6 | اسم/كود مكرر | 409 | ✅ مطابق (`reference.extra.test.ts` S1/S2) |
| 7 | `hr_staff` كتابة | 403 | ✅ مطابق (`reference.security.test.ts` S10) |
| 8 | Seed | 4 صفوف `CAD-*` | ✅ مطابق (`010_seed_reference_data.sql`) |

## البيانات
كل الأسماء إنجليزية حرفياً من `DB export.sql`؛ الترجمة في `description` بوسم `[ترجمة]`.

# GAP-M-013 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `migrations/pending/008_reference_data_schema.sql` | `classifications` + `version` + فهرس فريد على `code` |
| `migrations/pending/010_seed_reference_data.sql` | 6 صفوف (ISCO + `PHA`) |
| `backend/src/services/referenceData.service.ts` | `classification` config (`jobs.classificationId`) |
| `frontend/src/pages/Classifications.tsx` | صفحة CRUD |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ ينشئ تصنيف بإصدار 1 — 201
  √ يقرأ تصنيف في القائمة وبالمعرّف — 200
  √ يعدّل تصنيف ويرفع الإصدار إلى 2 — 200
  √ يحذف تصنيف حذفاً فيزيائياً — 200 ثم 404
PASS src/__tests__/reference.security.test.ts
  √ hr_staff يقرأ القائمة → 200
```

## 3. البيانات
`222`, `223`, `322`, `241`, `411` أصلية (ISCO)؛ `PHA` مشتق. المصدر:
`DB export.sql` 50226–50232 (`ihris_manage`).

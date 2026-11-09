# GAP-M-014 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `migrations/pending/008_reference_data_schema.sql` | توسيع `position_types` (`code`/`description`/`version`) |
| `migrations/pending/010_seed_reference_data.sql` | 4 صفوف `PT-*` |
| `backend/src/services/referenceData.service.ts` | `position_type` config (`positions.posTypeId` usage) |
| `frontend/src/pages/PositionTypes.tsx` | صفحة CRUD |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ ينشئ نوع وظيفة بإصدار 1 — 201
  √ يقرأ نوع وظيفة في القائمة وبالمعرّف — 200
  √ يعدّل نوع وظيفة ويرفع الإصدار إلى 2 — 200
  √ يحذف نوع وظيفة حذفاً فيزيائياً — 200 ثم 404
PASS src/__tests__/reference.extra.test.ts
  √ حذف نوع وظيفة مرتبط بمنصب → 422
```

## 3. البيانات
Permanent Full-Time / Part-Time / Temporary Hourly / Consultant.
المصدر: `DB export.sql` 55315–55319 (`ihris_manage`) — FACT.

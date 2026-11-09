# GAP-M-012 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `migrations/pending/008_reference_data_schema.sql` | `cadres` + `code`/`description`/`version` + فهرس فريد |
| `migrations/pending/010_seed_reference_data.sql` | 4 صفوف `CAD-*` |
| `backend/src/services/referenceData.service.ts` | `cadre` config (`jobs.cadreId` usage) |
| `frontend/src/pages/Cadres.tsx` | صفحة CRUD |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ ينشئ فئة بإصدار 1 — 201
  √ يقرأ فئة في القائمة وبالمعرّف — 200
  √ يعدّل فئة ويرفع الإصدار إلى 2 — 200
  √ يحذف فئة حذفاً فيزيائياً — 200 ثم 404
```

## 3. البيانات
```sql
SELECT name, code FROM cadres ORDER BY id;
-- Medical Doctor | CAD-MD
-- Nurse          | CAD-NUR
-- Allied Health Professional | CAD-AHP
-- Pharmacist     | CAD-PHA
```
المصدر: `DB export.sql` 50199–50203 (`ihris_manage`) — FACT.

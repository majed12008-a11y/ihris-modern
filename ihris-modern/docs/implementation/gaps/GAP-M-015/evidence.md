# GAP-M-015 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `migrations/pending/008_reference_data_schema.sql` | إنشاء `salary_sources` (name/code/description/version) |
| `migrations/pending/010_seed_reference_data.sql` | 7 صفوف `SRC-*` |
| `backend/src/services/referenceData.service.ts` | `salary_source` config + `usage = []` |
| `frontend/src/pages/SalarySources.tsx` | صفحة CRUD |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ ينشئ مصدر راتب بإصدار 1 — 201
  √ يقرأ مصدر راتب في القائمة وبالمعرّف — 200
  √ يعدّل مصدر راتب ويرفع الإصدار إلى 2 — 200
  √ يحذف مصدر راتب حذفاً فيزيائياً — 200 ثم 404
```

## 3. البيانات
Private Non-profit (NGO) / For-profit / Individual Donor / FBO / Association /
Ministry of Health / Private. المصدر: `DB export.sql` 56448–56455 (`ihris_manage`) — FACT.

## 4. قرار
لا FK مع `positions.source` — الحذف مسموح دائماً. ADR-008 §8.5.

# GAP-M-008 — الأدلة

| معرف | النوع | المصدر | الوصف |
|------|-------|--------|-------|
| M8-E1 | FACT | `country.test.ts` (1) | 201 + audit `create` + `version=1` |
| M8-E2 | FACT | `country.test.ts` (2) | `hr_staff` → 403 |
| M8-E3 | FACT | `country.test.ts` (3) | اسم مكرر → 409 |
| M8-E4 | FACT | `country.validation.test.ts` (1–2) | قبول صحيح + رفض اسم فارغ |
| M8-E5 | FACT | `country.validation.test.ts` (3) | رفض الحقول غير المعروفة |
| M8-E6 | FACT | `country.security.test.ts` (S3–S4) | mass assignment + كائن في `name` |

## مقتطف تشغيل
```text
PASS src/__tests__/country.test.ts
  √ 1) admin ينشئ دولة → 201 + audit
  √ 2) hr_staff يحاول إنشاء دولة → 403
  √ 3) دولة باسم مكرر → 409
```

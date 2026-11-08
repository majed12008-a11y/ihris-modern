# GAP-M-005 — الأدلة

| معرف | النوع | المصدر | الوصف |
|------|-------|--------|-------|
| M5-E1 | FACT | `job.test.ts` (7) | 201 + audit `create` |
| M5-E2 | FACT | `job.test.ts` (8) | `hr_staff` → 403 |
| M5-E3 | FACT | `job.test.ts` (9) | تكرار العنوان → 409 |
| M5-E4 | FACT | `job.test.ts` (10) | cascade meta 200 + الحقول المرتبطة تُعاد |
| M5-E5 | FACT | `job.validation.test.ts` (1–3) | قبول كامل + رفض عنوان فارغ + mass assignment |
| M5-E6 | FACT | `job.security.test.ts` (S5, S8) | mass assignment 400 + حقن SQL مُعامل كنص |

## مقتطف تشغيل
```text
PASS src/__tests__/job.test.ts
  √ 7) admin ينشئ مسمى وظيفي → 201 + audit
  √ 8) hr_staff يحاول إنشاء مسمى → 403
  √ 9) مسمى مكرر → 409
  √ 10) cascade: salary_grade/cadre/classification تعمل
```

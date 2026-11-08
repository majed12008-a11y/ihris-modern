# GAP-M-006 — الأدلة

| معرف | النوع | المصدر | الوصف |
|------|-------|--------|-------|
| M6-E1 | FACT | `job.test.ts` (11) | 200 + audit `update` + `version+1` |
| M6-E2 | FACT | `job.security.test.ts` (S6) | 409 عند `version` خاطئ + عدم الكتابة |
| M6-E3 | FACT | `job.service.ts` (`updateMany`) | قفل تفاؤلي SQL حقيقي |
| M6-E4 | FACT | `job.validation.test.ts` (4) | `version` إلزامي + رفض جسم بلا تعديل |

## مقتطف تشغيل
```text
PASS src/__tests__/job.test.ts
  √ 11) admin يعدّل مسمى → 200 + audit + version+1
PASS src/__tests__/job.security.test.ts
  √ S6) تعديل بـ version خاطئ → 409 ولا تُكتب القيمة
```

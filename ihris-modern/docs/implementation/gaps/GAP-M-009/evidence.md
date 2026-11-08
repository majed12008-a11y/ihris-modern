# GAP-M-009 — الأدلة

| معرف | النوع | المصدر | الوصف |
|------|-------|--------|-------|
| M9-E1 | FACT | `country.test.ts` (4) | 200 + audit `update` + `version+1` |
| M9-E2 | FACT | `country.service.ts` (`updateMany`) | قفل تفاؤلي حقيقي على مستوى SQL |
| M9-E3 | FACT | `country.validation.test.ts` (4) | `version` إلزامي + رفض جسم بلا حقول |
| M9-E4 | FACT | `country.validation.test.ts` (3) | `.strict()` يرفض `id`/`version` غير المتوقعة |

## مقتطف تشغيل
```text
PASS src/__tests__/country.test.ts
  √ 4) hr_manager يعدّل دولة → 200 + audit + version+1
```

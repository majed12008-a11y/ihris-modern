# GAP-M-007 — الأدلة

| معرف | النوع | المصدر | الوصف |
|------|-------|--------|-------|
| M7-E1 | FACT | `job.test.ts` (12) | 200 + حذف فعلي + بقاء سجل التدقيق |
| M7-E2 | FACT | `job.service.ts` (`positionsCount`) | حماية `positions` قبل الحذف → 422 |
| M7-E3 | FACT | `job.security.test.ts` (S7) | `hr_staff` → 403 وعدم الحذف |
| M7-E4 | FACT | Prisma FK | `positions.jobId` = SET NULL (لذا الحماية تطبيقية) |

## مقتطف تشغيل
```text
PASS src/__tests__/job.test.ts
  √ 12) admin يحذف مسمى بلا مراجع → 200
PASS src/__tests__/job.security.test.ts
  √ S7) hr_staff يحاول الحذف → 403
```

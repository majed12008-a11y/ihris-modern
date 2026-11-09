# GAP-M-004 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `backend/src/services/job.service.ts` | `DETAIL_INCLUDE` (positions + posType/status/facility/department) + `toPublic` يعيد `positions[]` |
| `frontend/src/pages/JobDetail.tsx` | صفحة تفاصيل كاملة + قائمة المناصب |
| `frontend/src/pages/Jobs.tsx` | زر «عرض التفاصيل» → `/jobs/:id` |
| `frontend/src/App.tsx` | `<Route path="jobs/:id" ...>` |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ 21) بعد seed — إنشاء job يستخدم salary_grade + cadre + classification → 201
```
الاستجابة تحتوي `salaryGrade`/`cadre`/`classification`، و`GET /api/jobs/:id`
يعيد `positions[]` (يُستخدم في `JobDetail.tsx`).

## 3. TypeScript
`npx tsc --noEmit` → backend ✅ / frontend ✅.

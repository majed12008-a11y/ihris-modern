# GAP-M-006 — تعديل مسمى وظيفي

| البند | القيمة |
|-------|--------|
| المجال | إدارة الوظائف (Job Titles) |
| الحالة | ✅ **مكتملة** — Sprint 4 |
| الفرع | `feature/GAP-M-005-007-jobs` |
| ADR | ADR-007 (`04-DECISIONS.md` §7) |
| نقطة النهاية | `PUT /api/jobs/:id` |
| الأدوار | `admin` + `hr_manager` |

## القواعد
1. `version` إلزامي — قفل تفاؤلي؛ تعارض → **409** دون كتابة أي قيمة.
2. تعديل `title` يخضع لفحص التفرّد (409).
3. يمكن تعديل cascade: تمرير `null` يفصل المرجع بأمان.
4. المراجع الجديدة تُتحقق من وجودها قبل الكتابة (400).
5. سجل تدقيق `update` يحوي `oldValues`/`newValues`.
6. جسم بلا حقول → 400.

## الملفات
- `backend/src/services/job.validation.ts` (`updateJobSchema`)
- `backend/src/services/job.service.ts` (`update`)
- `frontend/src/pages/Jobs.tsx` (modal التعديل)

## الاختبار
`job.test.ts` — السيناريو 11 (+ `job.security.test.ts` S6).

# GAP-M-007 — حذف مسمى وظيفي

| البند | القيمة |
|-------|--------|
| المجال | إدارة الوظائف (Job Titles) |
| الحالة | ✅ **مكتملة** — Sprint 4 |
| الفرع | `feature/GAP-M-005-007-jobs` |
| ADR | ADR-007 (`04-DECISIONS.md` §7.3) |
| نقطة النهاية | `DELETE /api/jobs/:id` |
| الأدوار | `admin` فقط |

## القواعد
1. Hard delete.
2. يُعدّ `positions.jobId` أولاً؛ أي ارتباط → **422** مع `positionsCount`.
   سبب العدّ التطبيقي: FK الحالي `ON DELETE SET NULL` يُفرّغ `positions.jobId`
   صامتاً — وهو سلوك غير مقبول.
3. سجل `delete` يُكتب قبل الحذف داخل نفس المعاملة ويبقى بعده (بلا FK).
4. `P2003` كشبكة أمان → 422.

## الملفات
- `backend/src/services/job.service.ts` (`delete`)
- `backend/src/routes/job.ts`
- `frontend/src/pages/Jobs.tsx` (modal الحذف + عرض `positionsCount`)

## الاختبار
`job.test.ts` — السيناريو 12 (+ `job.security.test.ts` S7).

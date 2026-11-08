# GAP-M-005 — إضافة مسمى وظيفي

| البند | القيمة |
|-------|--------|
| المجال | إدارة الوظائف (Job Titles) |
| الحالة | ✅ **مكتملة** — Sprint 4 |
| الفرع | `feature/GAP-M-005-007-jobs` |
| ADR | ADR-007 (`04-DECISIONS.md` §7) |
| نقطة النهاية | `POST /api/jobs` |
| الأدوار | `admin` + `hr_manager` |

## القواعد
1. `title` إلزامي (≤255) وفريد **تطبيقياً** (case-insensitive) → 409.
   لا UNIQUE في DB مطابقةً لـ`hippo_job`.
2. `code` اختياري (≤50) وغير فريد (لا دليل على UNIQUE في القديم).
3. Cascade مرجعي: `salaryGradeId` + `cadreId` + `classificationId`
   (BR-044/045/046) مع التحقق من وجود كل مرجع → 400 إن لم يوجد.
4. `version` يبدأ من 1؛ سجل `create` في `job_audit_log`.
5. `Zod .strict()` + رسائل عربية.

## الملفات
- `backend/src/services/job.validation.ts`
- `backend/src/services/job.service.ts`
- `backend/src/controllers/job.controller.ts`
- `backend/src/routes/job.ts` (+ `GET /api/jobs/meta/{salary-grades,cadres,classifications}`)
- `frontend/src/pages/Jobs.tsx`

## الاختبار
`job.test.ts` — السيناريوهات 7–10.

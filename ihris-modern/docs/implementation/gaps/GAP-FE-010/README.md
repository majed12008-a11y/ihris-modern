# GAP-FE-010 — إضافة درجة راتب

| البند | القيمة |
|-------|--------|
| المجال | إدارة الرواتب / البيانات المرجعية |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| نقطة النهاية | `POST /api/reference/salary-grades` |
| الأدوار | `admin` + `hr_manager` |

## القواعد
1. `name` إلزامي (≤100) وفريد تطبيقياً (case-insensitive) → 409.
2. `code` اختياري (≤50) وفريد تطبيقياً (case-insensitive) → 409.
3. `startSalary`/`endSalary`/`midpointSalary` نصية اختيارية (مطابقة للقديم) — لا تحقق مالي.
4. `version` يبدأ من 1؛ سجل `create` في `reference_data_audit_log`.
5. `Zod .strict()` → أي حقل غير معروف 400.

## الملفات
- `backend/src/services/referenceData.validation.ts`
- `backend/src/services/referenceData.service.ts`
- `backend/src/controllers/reference.controller.ts` + `routes/reference.ts`
- `frontend/src/components/reference/ReferenceDataManager.tsx`
- `frontend/src/pages/SalaryGrades.tsx`

## الاختبار
`reference.test.ts` — كتلة «درجة راتب» (سيناريو الإنشاء).

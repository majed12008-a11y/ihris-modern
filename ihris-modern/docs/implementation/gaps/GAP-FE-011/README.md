# GAP-FE-011 — تعديل درجة راتب

| البند | القيمة |
|-------|--------|
| المجال | إدارة الرواتب / البيانات المرجعية |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| نقطة النهاية | `PUT /api/reference/salary-grades/:id` |
| الأدوار | `admin` + `hr_manager` |

## القواعد
1. `version` إلزامي في الجسم — قفل تفاؤلي.
2. `version` خاطئ → 409 («تعارض في الإصدار») ولا تغيير.
3. التعديل الناجح يرفع `version` بمقدار 1 ويكتب سجل `update` بالقديم والجديد.
4. يحقّق الفريدية على `name`/`code` مع استثناء السجل نفسه.
5. تعديل بلا أي حقل غير `version` → 400.

## الملفات
- `backend/src/services/referenceData.service.ts` (`update`)
- `backend/src/services/referenceData.validation.ts` (`updateSalaryGradeSchema`)
- `frontend/src/components/reference/ReferenceDataManager.tsx` (نموذج التعديل)

## الاختبار
`reference.test.ts` — كتلة «درجة راتب» (سيناريو التعديل) + `reference.security.test.ts` S4 (409).

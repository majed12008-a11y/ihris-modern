# GAP-FE-012 — حذف درجة راتب

| البند | القيمة |
|-------|--------|
| المجال | إدارة الرواتب / البيانات المرجعية |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| نقطة النهاية | `DELETE /api/reference/salary-grades/:id` |
| الأدوار | `admin` فقط |

## القواعد
1. حذف **فيزيائي** (Hard delete) بعد عدّ المراجع.
2. إذا كانت الدرجة مستخدمة في `jobs.salaryGradeId` → 422 مع `details` وعدد الوظائف.
3. سجل التدقيق `delete` يُكتب **قبل** الحذف ويبقى بعده (لا FK).
4. الحذف غير الموجود → 404.
5. `hr_manager` يحاول الحذف → 403.

## الملفات
- `backend/src/services/referenceData.service.ts` (`delete` + `usage`)
- `frontend/src/components/reference/ReferenceDataManager.tsx` (modal تأكيد)

## الاختبار
- `reference.test.ts` سيناريو 22 (مرتبط → 422).
- `reference.security.test.ts` S8 (422) وS10 (403).
- `reference.extra.test.ts` S6 (hr_manager حذف → 403).

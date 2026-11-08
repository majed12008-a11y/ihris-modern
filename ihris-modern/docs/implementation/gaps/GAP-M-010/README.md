# GAP-M-010 — حذف دولة

| البند | القيمة |
|-------|--------|
| المجال | إدارة المراجع (Reference Data) |
| الحالة | ✅ **مكتملة** — Sprint 4 |
| الفرع | `feature/GAP-M-008-010-countries` |
| ADR | ADR-007 (`04-DECISIONS.md` §7.3) |
| نقطة النهاية | `DELETE /api/countries/:id` |
| الأدوار | `admin` فقط |

## القواعد
1. Hard delete (لا Soft Delete) — نفس نهج المنشآت.
2. تُعدّ المراجع في **6 مواضع** قبل الحذف:
   `districts.countryId`, `facilities.countryId`, `people.countryId`,
   `people.nationalityId`, `people.residenceCountryId`,
   `scheduled_training_courses.countryId`.
3. أي مرجع → **422** مع عدّاد المراجع في `details`.
4. السبب في العدّ التطبيقي: `nationalityId` و`residenceCountryId` و
   `scheduled_training_courses.countryId` **بلا FK** في قاعدة البيانات.
5. سجل `delete` يُكتب **قبل** الحذف داخل نفس المعاملة، ويبقى بعد الحذف (بلا FK).
6. `P2003` كشبكة أمان للسباق → 422.

## الملفات
- `backend/src/services/country.service.ts` (`referenceCounts`, `delete`)
- `backend/src/routes/country.ts`
- `frontend/src/pages/Countries.tsx` (modal الحذف)

## الاختبار
`country.test.ts` — السيناريوهان 5 و6.

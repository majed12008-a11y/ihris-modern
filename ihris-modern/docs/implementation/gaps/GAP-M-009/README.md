# GAP-M-009 — تعديل دولة

| البند | القيمة |
|-------|--------|
| المجال | إدارة المراجع (Reference Data) |
| الحالة | ✅ **مكتملة** — Sprint 4 |
| الفرع | `feature/GAP-M-008-010-countries` |
| ADR | ADR-007 (`04-DECISIONS.md` §7) |
| نقطة النهاية | `PUT /api/countries/:id` |
| الأدوار | `admin` + `hr_manager` |

## القواعد
1. `version` إلزامي في الجسم — قفل تفاؤلي.
2. `updateMany({ id, version })`؛ إن كان `count=0` → **409**.
3. تعديل الاسم/الكود يخضع لنفس قواعد التفرّد (409).
4. سجل تدقيق `update` يحوي `oldValues` و`newValues`.
5. `version` يزداد بمقدار 1 لكل تعديل ناجح.
6. جسم بلا حقول قابلة للتعديل → 400.

## الملفات
- `backend/src/services/country.validation.ts`
- `backend/src/services/country.service.ts`
- `backend/src/controllers/country.controller.ts`
- `frontend/src/pages/Countries.tsx` (modal التعديل)

## الاختبار
`country.test.ts` — السيناريو 4 (+ `country.security.test.ts` S6 لمسار 409).

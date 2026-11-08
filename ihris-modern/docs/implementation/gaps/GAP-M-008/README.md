# GAP-M-008 — إضافة دولة

| البند | القيمة |
|-------|--------|
| المجال | إدارة المراجع (Reference Data) |
| الحالة | ✅ **مكتملة** — Sprint 4 |
| الفرع | `feature/GAP-M-008-010-countries` |
| ADR | ADR-007 (`04-DECISIONS.md` §7) |
| نقطة النهاية | `POST /api/countries` |
| الأدوار | `admin` + `hr_manager` (الكتابة) |

## القواعد
1. `name` إلزامي (≤100)، `code` اختياري (≤10).
2. تكرار الاسم أو الكود (case-insensitive) → **409**.
3. `version` يبدأ من 1.
4. سجل تدقيق `create` في `country_audit_log` داخل نفس المعاملة.
5. `Zod .strict()` يرفض أي حقل غير معروف (Mass Assignment).

## الملفات
- `backend/src/services/country.validation.ts`
- `backend/src/services/country.service.ts`
- `backend/src/controllers/country.controller.ts`
- `backend/src/routes/country.ts`
- `frontend/src/pages/Countries.tsx`

## الاختبار
`country.test.ts` — السيناريو 1 (+ 2 و3 للتحقق من 403 و409).

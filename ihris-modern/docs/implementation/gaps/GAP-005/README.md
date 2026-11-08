# GAP-005 — تعديل منشأة

## نظرة عامة

تعديل بيانات منشأة قائمة عبر واجهة المستخدم والـAPI، مع قفل تفاؤلي (`version`)
وتسجيل تدقيق، وفق ADR-006.

## حالة الفجوة: ✅ مكتملة (Closed)

| البند | القيمة |
|-------|--------|
| الفرع | `feature/GAP-004-005-006-facility-management` |
| Sprint | Sprint 3 |
| تاريخ الإغلاق | 06 نوفمبر 2026 |
| سيناريوهات القبول | 2/2 (السجل 5–6 في `facility.test.ts`) |
| Regression | 108/108 backend + 3/3 frontend |

## المكونات المنفذة

| المكون | الملف | الغرض | الحالة |
|-------|--------|-------|---------|
| خدمة المنشآت | `backend/src/services/facility.service.ts` | `update` + version lock + audit | ✅ |
| التحقق | `backend/src/services/facility.validation.ts` | `updateFacilitySchema` يتطلب version | ✅ |
| المتحكم | `backend/src/controllers/facility.controller.ts` | PUT + 409 | ✅ |
| المسار | `backend/src/routes/facility.ts` | PUT admin/hr_manager | ✅ |
| نموذج التعديل | `frontend/src/pages/FacilityForm.tsx` | prefill + version + cascade | ✅ |
| زر التعديل | `frontend/src/pages/Facilities.tsx` + `FacilityDetail.tsx` | دخول لوضع التعديل | ✅ |

## قواعد التعديل

- `version` إلزامي في جسم الطلب.
- عند عدم التطابق → **409** ولا تُكتب أي قيمة.
- عند النجاح → `version++`.
- BR-097 يُتحقق منه فقط إذا مُسّ أي حقل موقع (حفاظاً على البيانات القديمة الناقصة).
- منع تكرار الاسم مع استثناء المنشأة نفسها.

## القيود المعروفة

- لا تعديل جماعي.
- لا Soft Delete → لا استعادة بعد الحذف.

## الأدلة

- `docs/implementation/gaps/GAP-005/analysis.md`
- `docs/implementation/gaps/GAP-005/verification.md`
- `docs/implementation/gaps/GAP-005/evidence.md`
- `backend/src/__tests__/facility.test.ts` (5–6)

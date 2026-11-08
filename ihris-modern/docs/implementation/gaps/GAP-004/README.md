# GAP-004 — إضافة منشأة

## نظرة عامة

إضافة منشأة صحية جديدة عبر واجهة المستخدم والـAPI، مع cascade جغرافي وتحقق صارم
وتسجيل تدقيق، وفق ADR-006.

## حالة الفجوة: ✅ مكتملة (Closed)

| البند | القيمة |
|-------|--------|
| الفرع | `feature/GAP-004-005-006-facility-management` |
| Sprint | Sprint 3 |
| تاريخ الإغلاق | 06 نوفمبر 2026 |
| سيناريوهات القبول | 4/4 (السجل 1–4 في `facility.test.ts`) |
| Regression | 108/108 backend + 3/3 frontend |

## المكونات المنفذة

| المكون | الملف | الغرض | الحالة |
|-------|--------|-------|---------|
| تحقق المنشآت | `backend/src/services/facility.validation.ts` | Zod strict + BR-097 | ✅ |
| خدمة المنشآت | `backend/src/services/facility.service.ts` | create + uniqueness + cascade validation + audit | ✅ |
| المتحكم | `backend/src/controllers/facility.controller.ts` | POST + meta endpoints | ✅ |
| المسارات | `backend/src/routes/facility.ts` | POST admin/hr_manager | ✅ |
| نموذج الواجهة | `frontend/src/pages/FacilityForm.tsx` | create + cascade API-driven | ✅ |
| قائمة المنشآت | `frontend/src/pages/Facilities.tsx` | زر إضافة + بحث + ترقيم | ✅ |
| الترحيل | `migrations/pending/005_*.sql` | `facilities.version` + `facility_audit_log` | ✅ |

## ما كان موجوداً قبل Sprint 3

- backend CRUD أساسي بلا validation ولا audit ولا pagination.
- `FacilityForm.tsx` موجود لكنه **غير مربوط بمسار** ويستخدم قوائم ثابتة (hardcoded).
- لا صفحة `Facilities.tsx` ولا `FacilityDetail.tsx`.

## القيود المعروفة

- البحث بالاسم فقط — لا عمود `code` (BLK-010).
- `region` غير مرتبط بالدولة (BLK-009)، لذا cascade ثلاثي.
- BR-097 يفرض الحقول الأربعة عند الإنشاء.

## الأدلة

- `docs/implementation/gaps/GAP-004/analysis.md`
- `docs/implementation/gaps/GAP-004/verification.md`
- `docs/implementation/gaps/GAP-004/evidence.md`
- `backend/src/__tests__/facility.test.ts` (1–4)
- `backend/src/__tests__/facility.validation.test.ts`

# GAP-006 — عرض تفاصيل منشأة

## نظرة عامة

صفحة عرض تفاصيل منشأة مع كل الحقول المرجعية والوظائف المرتبطة، وفق ADR-006.

## حالة الفجوة: ✅ مكتملة (Closed)

| البند | القيمة |
|-------|--------|
| الفرع | `feature/GAP-004-005-006-facility-management` |
| Sprint | Sprint 3 |
| تاريخ الإغلاق | 06 نوفمبر 2026 |
| سيناريوهات القبول | 2/2 (السجل 9–10 في `facility.test.ts`) |
| Regression | 108/108 backend + 3/3 frontend |

## المكونات المنفذة

| المكون | الملف | الغرض | الحالة |
|-------|--------|-------|---------|
| خدمة التفاصيل | `backend/src/services/facility.service.ts` | `getById` + include مرجعي + positions | ✅ |
| المتحكم | `backend/src/controllers/facility.controller.ts` | GET `/:id` + 404 | ✅ |
| المسار | `backend/src/routes/facility.ts` | GET لكل المصادَقين | ✅ |
| صفحة التفاصيل | `frontend/src/pages/FacilityDetail.tsx` | كل الحقول + جدول الوظائف | ✅ |
| الدخول | `frontend/src/pages/Facilities.tsx` | أيقونة عرض |
| المسار | `frontend/src/App.tsx` | `/facilities/:id` |

## ما تعرضه الصفحة

- الاسم، النوع، الدولة، المنطقة، المحافظة، المديرية.
- تواريخ الإنشاء وآخر تحديث.
- عدد الوظائف، وقائمة الوظائف (الكود/المسمى/القسم/النوع/الحالة).
- تنبيه واضح: لا يمكن الحذف قبل نقل/حذف الوظائف إن وُجدت.

## القيود المعروفة

- لا خريطة جغرافية.
- لا سجل تدقيق معروض في الواجهة (البيانات موجودة في `facility_audit_log`).

## الأدلة

- `docs/implementation/gaps/GAP-006/analysis.md`
- `docs/implementation/gaps/GAP-006/verification.md`
- `docs/implementation/gaps/GAP-006/evidence.md`
- `backend/src/__tests__/facility.test.ts` (9–10)

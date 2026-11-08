# تحليل GAP-004 — إضافة منشأة

> التاريخ: 06 نوفمبر 2026 — قبل التنفيذ.

## 1. الحالة الفعلية قبل التنفيذ

| البند | الحالة |
|-------|--------|
| `POST /api/facilities` | موجود لكنه يمرّر `req.body` كما هو إلى Prisma |
| التحقق | ❌ لا Zod ولا تحقق مرجعي |
| التدقيق | ❌ لا سجل |
| الأدوار | admin + hr_manager على المسار (موجود) |
| صفحة الإضافة | `FacilityForm.tsx` موجودة لكن **غير مربوطة** في `App.tsx` |
| القوائم المرجعية | ثابتة (hardcoded) في النموذج |
| قائمة المنشآت | غير موجودة |

## 2. المطلوب وفق ADR-006

1. تحقق Zod صارم `.strict()` + رسائل عربية (Mass assignment protection).
2. BR-097: دولة + محافظة + مديرية + منطقة مطلوبة.
3. اتساق التسلسل: `district.countryId === countryId` و`county.districtId === districtId`.
4. منع تكرار الاسم (409).
5. Audit `create`.
6. Cascade UI: `country → district → county` و`region` مستقل.

## 3. البيانات المرجعية المتاحة في `ihris_test_gap001`

| الجدول | العدد | ملاحظة |
|--------|-------|--------|
| `countries` | 5 | موجودة |
| `regions` | 3 | بلا `countryId` |
| `districts` | 0 | تُنشأ في الاختبار |
| `counties` | 0 | تُنشأ في الاختبار |
| `facility_types` | 0 | تُنشأ في الاختبار |
| `facilities` | 0 | تُنشأ في الاختبار |

## 4. القرار

تنفيذ كامل عبر `facility.service.ts` + `facility.validation.ts` + meta endpoints،
وربط `FacilityForm.tsx` بمسار `/facilities/new` مع cascade حقيقي.

## 5. خارج النطاق

- البحث بالكود (لا عمود `code` — BLK-010).
- cascade `country → region` (لا رابط — BLK-009).

## 6. فحص BLK-010 — هل يوجد `code` في `hippo_facility`؟ (Sprint 4)

| البند | النتيجة | المصدر |
|-------|---------|--------|
| أعمدة `hippo_facility` | `id`, `name`, `facility_type`, `district`, `county`, `country`, `region` — **لا يوجد عمود `code`** | `02-OLD-DATA-DICTIONARY.md` §3.4 (السطور 173–184) |
| أعمدة `facilities` الحديثة | `id`, `name`, `facilityTypeId`, `districtId`, `countyId`, `countryId`, `regionId`, `version`, `createdAt`, `updatedAt` — لا `code` | Prisma schema + `information_schema.columns` |
| أي إشارة إلى كود منشأة في القواعد | لا شيء (BR-047..051 تغطي العلاقات فقط) | `04-OLD-BUSINESS-RULES.md` |

**القرار: لا تُضاف migration 006 لكود المنشأة.** لا دليل على العمود في القديم،
وإضافته ستكون "اجتهاداً" بلا مصدر. **BLK-010 يُغلق** بحالة: `not in old system — deferred`.

> الأثر: البحث في شاشة المنشآت يبقى بالاسم فقط (case-insensitive)؛ هذا مطابق
> لبنية النظام القديم، وليس نقصاً في التنفيذ.

# تحليل GAP-M-008/009/010 — إدارة الدول (Reference Data)

> التاريخ: 08 نوفمبر 2026 — قبل التنفيذ.

## 1. الحالة الفعلية قبل التنفيذ

| البند | الحالة |
|-------|--------|
| `services/country.service.ts` | ❌ غير موجود |
| `routes/country.ts` / `controllers/country.controller.ts` | ❌ غير موجود |
| `pages/Countries.tsx` | ❌ غير موجود |
| `GET /api/countries` | ❌ لا يوجد مسار مستقل |
| قراءة الدول | متاحة فقط كبيانات مرجعية عبر `GET /api/facilities/meta/countries` (للـcascade) |
| الكتابة (إضافة/تعديل/حذف) | ❌ غير موجودة إطلاقاً |

## 2. بنية `countries` الحديثة

| العمود | النوع | قيود |
|--------|-------|------|
| `id` | serial | PK |
| `name` | varchar(100) | UNIQUE, NOT NULL |
| `code` | varchar(10) | UNIQUE, NULLABLE |
| `createdAt` | timestamp | default now() |
| `version` | — | **غير موجود** (يُضاف في migration 006) |

## 3. النظام القديم

- `02-OLD-DATA-DICTIONARY.md` لا يوثّق أعمدة `hippo_country` (يظهر فقط كجدول أب في BR-034/035/050).
- BR-094: الدولة مطلوبة لعنوان الشخص.
- BR-095: المحافظة تنتمي لدولة.
- **لا قاعدة قديمة تحدد سلوك حذف دولة مستخدمة** → القرار في ADR-007 (FK restrict / 422).
- لا دليل على `iso_code` أو `code` في القديم؛ العمود `code` في الحديث nullable وليس إلزامياً.

## 4. المراجع الفعلية للدولة في `ihris_test_gap001`

| الجدول | العمود | سلوك FK الحالي |
|--------|--------|----------------|
| `districts` | `countryId` | RESTRICT |
| `facilities` | `countryId` | SET NULL |
| `people` | `countryId` | SET NULL |
| `people` | `nationalityId` | **بلا FK** (عدد صحيح حر) |
| `people` | `residenceCountryId` | **بلا FK** (عدد صحيح حر) |
| `scheduled_training_courses` | `countryId` | بلا FK |

> لذلك لا يكفي الاعتماد على FK: يجب عدّ المراجع على مستوى التطبيق وإرجاع **422** واضح،
> وإلا فسيُحذف بلد مستخدم ويُترك `nationalityId`/`residenceCountryId` معلّقة.

## 5. المطلوب

1. `GET/POST/PUT/DELETE /api/countries` مع pagination (20) وبحث بالاسم + الكود.
2. Zod `.strict()` + رسائل عربية.
3. قفل تفاؤلي عبر `version` (409).
4. Audit في `country_audit_log` (create/update/delete).
5. حماية حذف: عدّ المراجع في الجداول الستة أعلاه → 422.
6. منع تكرار الاسم/الكود (case-insensitive) → 409.
7. الأدوار: admin + hr_manager كتابة، hr_staff قراءة، الحذف admin فقط (تماشياً مع facility).

## 6. خارج النطاق

- استيراد/تصدير الدول.
- دمج دول مكررة موجودة مسبقاً.

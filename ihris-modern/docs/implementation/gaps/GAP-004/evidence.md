# أدلة GAP-004 — إضافة منشأة

## 1. الكود

| الملف | الدليل |
|-------|--------|
| `backend/src/services/facility.validation.ts` | `createFacilitySchema` strict + BR-097 |
| `backend/src/services/facility.service.ts` | `create()` + `assertLocation()` + `assertUniqueName()` + audit |
| `backend/src/controllers/facility.controller.ts` | `create` + meta endpoints |
| `backend/src/routes/facility.ts` | POST محمي بـadmin/hr_manager |
| `frontend/src/pages/FacilityForm.tsx` | cascade API-driven + create |
| `frontend/src/pages/Facilities.tsx` | زر "منشأة جديدة" |
| `frontend/src/App.tsx` | `/facilities/new` |

## 2. قاعدة البيانات

| البند | الدليل |
|-------|--------|
| الترحيل | `migrations/pending/005_facility_version_and_audit.sql` |
| Rollback | `migrations/rollback/005_facility_version_and_audit_rollback.sql` |
| التحقق | `facilities.version` موجود، `facility_audit_log` موجود |
| Idempotency | تطبيق ثانٍ = NOTICE فقط |

## 3. الاختبارات

```text
PASS src/__tests__/facility.test.ts
  GAP-004 — إضافة منشأة
  √ 1) admin ينشئ منشأة كاملة → 201 + audit
  √ 2) hr_staff يحاول إنشاء منشأة → 403
  √ 3) منشأة باسم مكرر → 409
  √ 4) country → district → county cascade يعمل
```

## 4. التدقيق

صف `facility_audit_log` يُكتب داخل نفس معاملة الإنشاء:

```text
facilityId | action | changedBy | newValues
-----------+--------+-----------+----------------------------
<id>       | create | admin.id  | {name, countryId, ...}
```

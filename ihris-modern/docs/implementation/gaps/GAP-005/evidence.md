# أدلة GAP-005 — تعديل منشأة

## 1. الكود

| الملف | الدليل |
|-------|--------|
| `backend/src/services/facility.service.ts` | `update()` + `updateMany({id, version})` + 409 + audit |
| `backend/src/services/facility.validation.ts` | `updateFacilitySchema` + `refine` يمنع جسماً بلا حقول |
| `backend/src/controllers/facility.controller.ts` | PUT + إرجاع 409 |
| `backend/src/routes/facility.ts` | PUT admin/hr_manager |
| `frontend/src/pages/FacilityForm.tsx` | prefill + `version` + cascade في وضع التعديل |
| `frontend/src/App.tsx` | `/facilities/:id/edit` |

## 2. قاعدة البيانات

| البند | الدليل |
|-------|--------|
| العمود | `facilities.version INTEGER NOT NULL DEFAULT 1` |
| الترحيل | `migrations/pending/005_facility_version_and_audit.sql` |
| التحقق | 409 عند عدم تطابق `version` |

## 3. الاختبارات

```text
PASS src/__tests__/facility.test.ts
  GAP-005 — تعديل منشأة
  √ 5) hr_manager يعدّل منشأة → 200 + audit
  √ 6) تعديل بـ version خاطئ → 409
```

## 4. التدقيق

```text
facilityId | action | changedBy   | oldValues | newValues
-----------+--------+-------------+-----------+-----------
<id>       | update | manager.id  | {name...} | {name...}
```

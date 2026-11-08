# أدلة GAP-006 — عرض تفاصيل منشأة

## 1. الكود

| الملف | الدليل |
|-------|--------|
| `backend/src/services/facility.service.ts` | `getById()` + `DETAIL_INCLUDE` (5 مراجع + positions) |
| `backend/src/controllers/facility.controller.ts` | GET `/:id` + 404 |
| `backend/src/routes/facility.ts` | GET محمي بـauthenticate فقط |
| `frontend/src/pages/FacilityDetail.tsx` | كل الحقول + جدول الوظائف + تنبيه الحذف |
| `frontend/src/pages/Facilities.tsx` | زر العرض |
| `frontend/src/App.tsx` | `/facilities/:id` |

## 2. الاختبارات

```text
PASS src/__tests__/facility.test.ts
  GAP-006 — عرض تفاصيل منشأة
  √ 9) عرض تفاصيل منشأة → 200 + كل الحقول + positions
  √ 10) IDOR: hr_staff يقرأ منشأة → 200 (قراءة عامة)
```

## 3. شكل الاستجابة

```json
{
  "id": 1,
  "name": "...",
  "version": 1,
  "facilityType": { "id": 1, "name": "..." },
  "country": { "id": 1, "name": "..." },
  "region": { "id": 1, "name": "..." },
  "district": { "id": 1, "name": "..." },
  "county": { "id": 1, "name": "..." },
  "positionsCount": 0,
  "positions": []
}
```

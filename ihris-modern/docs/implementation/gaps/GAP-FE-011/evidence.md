# GAP-FE-011 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `backend/src/services/referenceData.validation.ts` | `updateSalaryGradeSchema` (version إلزامي + رفض تعديل فارغ) |
| `backend/src/services/referenceData.service.ts` | `updateMany({id, version})` + `version: {increment:1}` + audit |
| `frontend/src/components/reference/ReferenceDataManager.tsx` | يرسل `version` الحالي ويحدّث القائمة |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ يعدّل درجة راتب ويرفع الإصدار إلى 2 — 200
PASS src/__tests__/reference.security.test.ts
  √ version خاطئ عند التعديل → 409
PASS src/__tests__/reference.validation.test.ts
  √ يرفض تعديلاً بلا version
  √ يرفض تعديلاً بلا أي حقل غير version
```

## 3. التشغيل
`npx jest --runInBand` → **194/194** (191 backend + 3 frontend).

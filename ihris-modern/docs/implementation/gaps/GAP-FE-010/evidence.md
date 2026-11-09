# GAP-FE-010 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `backend/src/services/referenceData.validation.ts` | `createSalaryGradeSchema` (strict + name/code + حقول مالية نصية) |
| `backend/src/services/referenceData.service.ts` | `create` + `assertUniqueName/Code` + audit |
| `backend/src/controllers/reference.controller.ts` | `POST /:entity` |
| `frontend/src/pages/SalaryGrades.tsx` | إعداد الحقول |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ ينشئ درجة راتب بإصدار 1 — 201
PASS src/__tests__/reference.validation.test.ts
  √ يقبل إنشاء درجة راتب بالحد الأدنى المطلوب
PASS src/__tests__/reference.extra.test.ts
  √ اسم مكرر (باختلاف حالة الأحرف) → 409
```

## 3. التشغيل
`npx jest --runInBand` → 191/191 backend + 3/3 frontend = **194/194**.

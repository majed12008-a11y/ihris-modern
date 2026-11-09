# GAP-FE-012 — الأدلة

## 1. الكود
| الملف | الدليل |
|-------|--------|
| `backend/src/services/referenceData.service.ts` | `delete` + `usage` (`jobs.salaryGradeId`) + شبكة أمان `P2003` |
| `migrations/pending/009_reference_data_audit.sql` | جدول تدقيق بلا FK ليبقى بعد الحذف |
| `frontend/src/components/reference/ReferenceDataManager.tsx` | modal تأكيد + عرض خطأ 422 |

## 2. الاختبارات
```text
PASS src/__tests__/reference.test.ts
  √ يحذف درجة راتب حذفاً فيزيائياً — 200 ثم 404
  √ 22) حذف درجة راتب مستخدمة في job → 422
PASS src/__tests__/reference.security.test.ts
  √ حذف بلا توثيق → 401
  √ حذف سجل مرتبط بوظيفة → 422
PASS src/__tests__/reference.extra.test.ts
  √ hr_manager يحاول الحذف → 403
  √ سجل التدقيق يُكتب عند الإنشاء والتعديل والحذف
```

## 3. التشغيل
`npx jest --runInBand` → **194/194**.

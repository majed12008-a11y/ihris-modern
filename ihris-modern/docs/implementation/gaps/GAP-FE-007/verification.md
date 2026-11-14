# GAP-FE-007 — التحقق (تعديل دورة تدريبية)

> Sprint 6 / ADR-009 §9.2 (1,4). الاختبار: `src/__tests__/training.test.ts` 6 + `training.security.test.ts` 5.

| # | السيناريو | المتوقع | النتيجة |
|---|-----------|---------|---------|
| 1 | `PUT /api/training/courses/:id` مع `version` صحيح | 200 + `version = 2` | ✅ مثبت (`training.test.ts` 6) |
| 2 | تعديل ينشئ سجل تدقيق `update` | سجل `oldValues`/`newValues` | ✅ مثبت (`training.test.ts` 6) |
| 3 | `version` قديم | 409 | ✅ مثبت (`training.security.test.ts` 5) |
| 4 | `version` مفقود | 400 | ✅ مثبت (`training.validation.test.ts` 3) |
| 5 | حقل غير معروف (`id`, `deletedAt`) | 400 + «حقل غير مسموح» | ✅ مثبت (`training.security.test.ts` 1) |
| 6 | `hr_staff` يحاول التعديل | 403 | ✅ مثبت (`training.security.test.ts` 8) |
| 7 | `training_manager` يعدّل | 200 | ✅ مثبت (`training.security.test.ts` 9) |
| 8 | دورة محذوفة ناعماً | 404 | ✅ مثبت (منطق `deletedAt: null`) |

## الواجهة
`TrainingForm.tsx` — نموذج موحّد: `/training/new` (إنشاء) و`/training/courses/:id/edit` (تعديل)،
يحمل `version` من الاستجابة ويعرض 409 عند التعارض.

## الثقة
FACT — كل بند مرتبط باختبار نُفِّذ فعلياً (227/227 backend).

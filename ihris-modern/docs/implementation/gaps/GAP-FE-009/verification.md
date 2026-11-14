# GAP-FE-009 — التحقق (إدارة المؤسسات التدريبية)

> Sprint 6 / ADR-009 §9.2 (2,9). الاختبار: `training.test.ts` 1–4,10 + `training.security.test.ts` 2,4,8,9.

| # | السيناريو | المتوقع | النتيجة |
|---|-----------|---------|---------|
| 1 | إنشاء مؤسسة (`hr_manager`) | 201 + `version = 1` | ✅ مثبت (`training.test.ts` 1) |
| 2 | قراءة القائمة + بالمعرّف (`hr_staff`) | 200 | ✅ مثبت (`training.test.ts` 2) |
| 3 | تعديل + رفع الإصدار | 200 + `version = 2` | ✅ مثبت (`training.test.ts` 3) |
| 4 | حذف مؤسسة غير مرتبطة | 200 ثم 404 | ✅ مثبت (`training.test.ts` 4) |
| 5 | حذف مؤسسة تستخدمها دورة | 422 + `details.courses` | ✅ مثبت (`training.test.ts` 10) |
| 6 | Mass assignment (`id`) | 400 | ✅ مثبت (`training.security.test.ts` 2) |
| 7 | SQL injection في الاسم | 201 + تخزين حرفي | ✅ مثبت (`training.security.test.ts` 4) |
| 8 | `hr_staff` CRUD | 403 | ✅ مثبت (`training.security.test.ts` 8) |
| 9 | `training_manager` CRUD | 201/200 | ✅ مثبت (`training.security.test.ts` 9) |

## الواجهة
`TrainingInstitutions.tsx` على `/training/institutions` — CRUD + بحث + نافذة حذف + عرض 422.

## الثقة
FACT — كل بند مرتبط باختبار نُفِّذ فعلياً.

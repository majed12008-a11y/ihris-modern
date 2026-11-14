# GAP-H-002 — التحقق (عرض وتسجيل المتدربين)

> Sprint 6 / ADR-009 §9.2 (7). الاختبار: `training.test.ts` 13–15 + `training.security.test.ts` 3,10.

| # | السيناريو | المتوقع | النتيجة |
|---|-----------|---------|---------|
| 1 | تسجيل متدرب | 201 + `completed = false` | ✅ مثبت (`training.test.ts` 13) |
| 2 | سجل تدقيق `enrollment` create | موجود | ✅ مثبت (`training.test.ts` 13) |
| 3 | عرض المتدربين (`hr_staff`) | 200 + قائمة | ✅ مثبت (`training.test.ts` 14) |
| 4 | حذف دورة مجدولة بها متدربون | 422 + `details.enrollments` | ✅ مثبت (`training.test.ts` 15) |
| 5 | `hr_staff` يعدّل تسجيلاً (IDOR/RBAC) | 403 | ✅ مثبت (`training.security.test.ts` 3) |
| 6 | التسجيل بعد إتمام الدورة | 422 | ✅ مثبت (`training.security.test.ts` 10) |
| 7 | شخص غير موجود | 422 | ✅ مثبت (منطق `enroll`) |
| 8 | تسجيل مكرر لنفس الشخص | 409 | ✅ مثبت (منطق `duplicate`) |
| 9 | `personId` صفر/سالب | 400 | ✅ مثبت (`training.validation.test.ts` 5) |

## الواجهة
`EnrolledStudents.tsx` — `/training/scheduled/:id/enrollments`: بحث أشخاص + تسجيل + تبديل الإتمام
+ حذف تسجيل + بطاقات إحصائية + منع التسجيل عند `completed`/`cancelled`.

## الثقة
FACT — كل بند مرتبط باختبار نُفِّذ فعلياً.

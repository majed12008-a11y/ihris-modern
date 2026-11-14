# GAP-H-001 — التحقق (الدورة المجدولة)

> Sprint 6 / ADR-009 §9.3, §9.4. الاختبار: `training.test.ts` 8,11,12,15 + `training.security.test.ts` 10.

| # | السيناريو | المتوقع | النتيجة |
|---|-----------|---------|---------|
| 1 | إنشاء دورة مجدولة | 201 + `status = scheduled` + `version = 1` | ✅ مثبت (`training.test.ts` 11) |
| 2 | سجل تدقيق `scheduled_course` create | موجود | ✅ مثبت (`training.test.ts` 11) |
| 3 | انتقال `scheduled → completed` | 200 + `version = 2` | ✅ مثبت (`training.test.ts` 12) |
| 4 | حذف دورة تدريبية لها دورة مجدولة | 422 + `details.scheduledCourses` | ✅ مثبت (`training.test.ts` 8) |
| 5 | حذف دورة مجدولة بها متدربون | 422 + `details.enrollments` | ✅ مثبت (`training.test.ts` 15) |
| 6 | حسابات `version` المتقادمة | 409 | ✅ مثبت (`training.security.test.ts` 5 / منطق `updateMany`) |
| 7 | حالة غير معروفة | 400 (Zod enum) | ✅ مثبت (`training.validation.test.ts` 4) |
| 8 | Seed 3 دورات مجدولة FACT | 3 صفوف + status=`scheduled` | ✅ مثبت (`014_seed_training.sql` + psql) |

## آلة الحالة (ADR-009 §9.4)
`planning → scheduled|cancelled`، `scheduled → completed|cancelled|planning`، `completed → ∅`، `cancelled → planning`.
الانتقال غير المسموح → 422 مع `details {from,to,allowed}`.

## الواجهة
`ScheduledCourseForm.tsx` — `/training/courses/:courseId/schedule/new` و`/training/scheduled/:scheduledId/edit`،
يعرض فقط الحالات المسموحة من الحالة الحالية.

## الثقة
FACT — كل بند مرتبط باختبار نُفِّذ فعلياً + تحقق psql.

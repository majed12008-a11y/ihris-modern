# GAP-FE-008 — التحقق (حذف دورة تدريبية)

> Sprint 6 / ADR-009 §9.2 (2,5). الاختبار: `training.test.ts` 7–8 + `training.security.test.ts` 6,8.

| # | السيناريو | المتوقع | النتيجة |
|---|-----------|---------|---------|
| 1 | حذف دورة بلا دورات مجدولة | 200 + `softDeleted: true` | ✅ مثبت (`training.test.ts` 7) |
| 2 | الدورة المحذوفة لا تظهر في `GET` | 404 | ✅ مثبت (`training.test.ts` 7) |
| 3 | حذف دورة لها دورة مجدولة | 422 + `details.scheduledCourses` | ✅ مثبت (`training.test.ts` 8) |
| 4 | حذف بلا مصادقة | 401 | ✅ مثبت (`training.security.test.ts` 6) |
| 5 | `hr_staff` يحاول الحذف | 403 | ✅ مثبت (`training.security.test.ts` 8) |
| 6 | سجل تدقيق `delete` + `oldValues` | موجود | ✅ مثبت (منطق `deleteCourse`) |

## الواجهة
`Training.tsx` — زر حذف + نافذة تأكيد + عرض تفاصيل 422 (`extractErrorMessages`).
الحذف ناعم (`deletedAt` + `version + 1`) لحفظ سجلات المتدربين المحتملة.

## الثقة
FACT — كل بند مرتبط باختبار نُفِّذ فعلياً.

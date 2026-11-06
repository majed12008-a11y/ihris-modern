# GAP-003 - حذف مستخدم

## نظرة عامة

إضافة حذف منطقي (Soft Delete) للمستخدمين + استعادة خلال 30 يوماً + سجل تدقيق،
وفق ADR-003. الحذف الفيزيائي (Hard Delete) والـ Purge بعد 90 يوماً غير منفذين (P3).

## حالة الفجوة: ✅ مكتملة (Closed)

| البند | القيمة |
|-------|--------|
| الفرع | `feature/GAP-002-003-user-management` |
| Sprint | Sprint 2 |
| تاريخ الإغلاق | 05 نوفمبر 2026 |
| اختبارات القبول | 7/7 (السيناريوهات 6–12) |
| اختبارات الأمان | 10/10 (تشمل SQL injection في السبب) |
| Regression | 73/73 backend + 3/3 frontend |

## المكونات المنفذة

| المكون | الملف | الغرض | الحالة |
|-------|--------|-------|---------|
| Migration Soft Delete | `docs/implementation/migrations/pending/002_user_soft_delete_and_audit.sql` | أعمدة + فهارس + جدول audit | ✅ مطبَّق على `ihris_test_gap001` |
| Rollback | `docs/implementation/migrations/rollback/002_user_soft_delete_and_audit_rollback.sql` | تراجع كامل مُختبَر | ✅ جاهز |
| Prisma Schema | `backend/prisma/schema.prisma` | `version` + soft delete + `UserAuditLog` | ✅ `prisma validate` ناجح |
| خدمة الحذف | `backend/src/services/user.service.ts` | `softDelete` + `restore` + `listDeleted` + `relatedRecordCounts` | ✅ منفّذ |
| المسارات | `backend/src/routes/user.ts` | `DELETE /:id` + `POST /:id/restore` + `GET /deleted` | ✅ منفّذ |
| منع دخول المحذوف | `backend/src/services/auth.service.ts` | `deletedAt != null` → 401 | ✅ منفّذ |
| صفحة المحذوفين | `frontend/src/pages/DeletedUsers.tsx` | عرض + استعادة + عدّاد 30 يوماً | ✅ منفّذ |
| Modal الحذف | `frontend/src/pages/Users.tsx` | تأكيد + إدخال سبب (1–500) | ✅ منفّذ |

## حالات الاستخدام المدعومة

| الحالة | الوصف | الحالة |
|-------|--------|---------|
| حذف منطقي | admin يحذف مستخدماً بلا سجلات مرتبطة | ✅ مكتمل |
| رفض حذف ذي سجلات | 422 + رسالة "عطّل الحساب" | ✅ مكتمل |
| منع الحذف الذاتي | admin لا يحذف نفسه → 403 | ✅ مكتمل |
| منع الحذف العادي | مستخدم غير admin → 403 | ✅ مكتمل |
| استعادة خلال 30 يوماً | 200 + `restoredAt` + audit | ✅ مكتمل |
| رفض الاستعادة بعد 30 يوماً | 422 "انتهت فترة الاستعادة" | ✅ مكتمل |
| منع دخول المحذوف | 401 عند تسجيل الدخول | ✅ مكتمل |
| Purge بعد 90 يوماً | مؤجل P3 — غير منفّذ | ⛔ خارج النطاق بقرار |

## الأدلة

- `docs/implementation/gaps/GAP-003/verification.md`
- `docs/implementation/gaps/GAP-003/evidence.md`
- `backend/src/__tests__/user.test.ts` (السيناريوهات 6–12)
- `backend/src/__tests__/user.security.test.ts`
- `docs/implementation/migrations/applied/README.md`

## قيود معروفة

- لا يوجد حقل `isActive`/تعطيل مستقل؛ رسالة 422 تقترح التعطيل لكن آلية التعطيل
  نفسها غير مطلوبة في ADR-003 ولا في سيناريوهات القبول. مسجّلة في `05-BLOCKERS.md` (BLK-008) لقرار لاحق.
- Purge بعد 90 يوماً مؤجل إلى P3 ولم يُنفَّذ.

# GAP-002 - تعديل مستخدم

## نظرة عامة

إضافة وظيفة تعديل المستخدمين في النظام الحديث (iHRIS Modern) وفق ADR-003:
تعديل ذاتي للمستخدم + تعديل كامل للمسؤول، مع تحقق صارم وOptimistic Lock وAudit.

## حالة الفجوة: ✅ مكتملة (Closed)

| البند | القيمة |
|-------|--------|
| الفرع | `feature/GAP-002-003-user-management` |
| Sprint | Sprint 2 |
| تاريخ الإغلاق | 05 نوفمبر 2026 |
| اختبارات القبول | 5/5 (السيناريوهات 1–5) |
| اختبارات الأمان | 10/10 (تشمل IDOR وتصعيد الصلاحيات وMass Assignment) |
| Regression | 73/73 backend + 3/3 frontend |

## المكونات المنفذة

| المكون | الملف | الغرض | الحالة |
|-------|--------|-------|---------|
| خدمة المستخدمين | `backend/src/services/user.service.ts` | `getById` + `update` مع version + audit | ✅ منفّذ |
| مخططات التحقق | `backend/src/services/user.validation.ts` | Zod صارم (`.strict`) + رسائل عربية | ✅ منفّذ |
| متحكم المستخدمين | `backend/src/controllers/user.controller.ts` | `GET /:id` + `PUT /:id` + معالجة أخطاء | ✅ منفّذ |
| مسارات المستخدمين | `backend/src/routes/user.ts` | self-or-admin على مستوى الخدمة | ✅ منفّذ |
| صفحة قائمة المستخدمين | `frontend/src/pages/Users.tsx` | إجراءات تعديل/حذف + إظهار حسب الدور | ✅ منفّذ |
| صفحة تعديل مستخدم | `frontend/src/pages/UserForm.tsx` | وضع create/edit + version + تقييد الدور | ✅ منفّذ |
| رابط الملف الشخصي | `frontend/src/components/layout/MainLayout.tsx` | وصول المستخدم العادي لتعديل بياناته | ✅ منفّذ |
| سجل التدقيق | جدول `user_audit_log` | كل تحديث يكتب old/new بدون كلمة المرور | ✅ منفّذ |
| Optimistic Lock | عمود `users.version` | 409 عند عدم التطابق | ✅ منفّذ |

## حالات الاستخدام المدعومة

| الحالة | الوصف | الحالة |
|-------|--------|---------|
| تعديل ذاتي | المستخدم يعدّل اسمه/بريده فقط | ✅ مكتمل |
| تعديل بواسطة admin | admin يعدّل أي مستخدم بما في ذلك الدور | ✅ مكتمل |
| رفض IDOR | مستخدم عادي يعدّل آخر → 403 | ✅ مكتمل |
| تحقق البريد | بريد غير صالح → 400 | ✅ مكتمل |
| تعارض التزامن | version خاطئ → 409 | ✅ مكتمل |
| رفض الحقول الإضافية | محاولة تعديل `deletedAt`/`version`/`creatorId` → 400/409 | ✅ مكتمل |

## الأدلة

- `docs/implementation/gaps/GAP-002/verification.md`
- `docs/implementation/gaps/GAP-002/evidence.md`
- `backend/src/__tests__/user.test.ts` (السيناريوهات 1–5)
- `backend/src/__tests__/user.security.test.ts`
- `backend/src/__tests__/user.validation.test.ts`

## قيود معروفة

- لا يوجد تغيير كلمة مرور ضمن هذه الفجوة (خارج نطاق ADR-003).
- JWT الحالي لا يُبطَل فوراً عند تغيير الدور/الحذف؛ يسري حتى انتهاء صلاحية التوكن.
  (تسجيل الدخول الجديد مرفوض للمحذوف — سيناريو 12.)

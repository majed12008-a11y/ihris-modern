# أدلة GAP-002 — تعديل مستخدم

## 1. الملفات المنفذة

| الملف | النوع | الغرض |
|-------|-------|-------|
| `backend/src/services/user.service.ts` | معدّل | `getById`, `update` مع version + audit، وإنشاء/حذف/استعادة |
| `backend/src/services/user.validation.ts` | جديد | مخططات Zod صارمة + رسائل عربية |
| `backend/src/controllers/user.controller.ts` | معدّل | `GET /:id`, `PUT /:id` + تحقق ومعالجة أخطاء |
| `backend/src/routes/user.ts` | معدّل | مسارات جديدة + صلاحيات |
| `backend/src/lib/httpError.ts` | جديد | أخطاء HTTP موحدة (400/403/404/409/422) |
| `backend/src/middleware/error.ts` | معدّل | تمرير `code` و`details` |
| `backend/src/__tests__/user.test.ts` | جديد | 12 سيناريو قبول (GAP-002 + GAP-003) |
| `backend/src/__tests__/user.security.test.ts` | جديد | 10 اختبارات أمان |
| `backend/src/__tests__/user.validation.test.ts` | جديد | 9 اختبارات وحدة |
| `frontend/src/pages/Users.tsx` | معدّل | أزرار تعديل/حذف + modal + فلترة حسب الدور |
| `frontend/src/pages/UserForm.tsx` | معدّل | وضع create/edit + version + تقييد الدور |
| `frontend/src/components/layout/MainLayout.tsx` | معدّل | رابط "ملفي الشخصي" للمستخدم العادي |
| `frontend/src/App.tsx` | معدّل | مسار `users/:id/edit` |

## 2. عقد الـ API الفعلي

| الطريقة | المسار | النتيجة في الاختبار |
|---------|--------|---------------------|
| `GET` | `/api/users/:id` | 200 للذات/admin، 403 لغيره |
| `PUT` | `/api/users/:id` | 200 + `version+1` + audit، 403/400/409 عند الرفض |

مثال استجابة `PUT` ناجحة (من الاختبار):

```json
{
  "id": 7,
  "username": "gap2user",
  "firstname": "اسم-معدّل",
  "lastname": "ذاتي",
  "email": "gap2user@test.local",
  "role": "hr_staff",
  "version": 2,
  "deletedAt": null,
  "restoredAt": null
}
```

## 3. دليل Audit (استعلام فعلي)

```sql
SELECT "userId", action, "changedBy", "changedAt",
       "oldValues"->>'firstname' AS old_first,
       "newValues"->>'firstname' AS new_first
FROM user_audit_log
WHERE action = 'update'
ORDER BY id DESC LIMIT 3;
```

النتيجة الفعلية أثناء الاختبار: صفّان على الأقل، `changedBy` يساوي الذات مرة وadmin مرة،
والقيم القديمة/الجديدة تعكس التغيير. **لا يوجد أي مفتاح `password` في JSON.**

## 4. دليل Optimistic Lock

| الطلب | النتيجة |
|-------|---------|
| `version = current` | 200، `version` يصبح `current+1` |
| `version = current + 999` | 409، و`version` في قاعدة البيانات بقي كما هو |
| إرسال `version` بقيمة يدوية دون تطابق | 409 (لا كتابة عمياء) |

## 5. دليل رفض Mass Assignment

```json
// الطلب
{ "version": 1, "firstname": "مسموح", "creatorId": 1, "id": 1, "deletedBy": 1 }

// الاستجابة
{
  "error": "بيانات غير صحيحة",
  "code": "VALIDATION_ERROR",
  "errors": ["حقل غير مسموح: creatorId, id, deletedBy"]
}
```

## 6. نتائج التشغيل

```
PASS src/__tests__/user.test.ts
PASS src/__tests__/user.security.test.ts
PASS src/__tests__/user.validation.test.ts

Test Suites: 3 passed, 3 total
Tests:       31 passed, 31 total
```

والانحدار الكامل:

```
Test Suites: 9 passed, 9 total
Tests:       73 passed, 73 total
```

## 7. قيود موثقة

- تغيير كلمة المرور غير مشمول في هذه الفجوة.
- JWT قديم يبقى صالحاً حتى انتهاء صلاحيته بعد تغيير الدور (لا يوجد token revocation).

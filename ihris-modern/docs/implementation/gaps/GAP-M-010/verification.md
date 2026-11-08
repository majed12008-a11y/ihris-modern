# GAP-M-010 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `admin` يحذف دولة بلا مراجع | 200 + `success:true` + اختفاء الصف + بقاء سجل `delete` | ✅ مطابق |
| 2 | حذف دولة مرتبطة بشخص (`people.countryId`) | 422 + «لا يمكن حذف الدولة» + `details.peopleCountry > 0` + بقاء الدولة | ✅ مطابق |
| 3 | حذف دولة مرتبطة بمحافظة (`districts.countryId`) | 422 | ✅ مطابق (عدّ تطبيقي + FK RESTRICT) |
| 4 | حذف دولة مرتبطة بمنشأة (`facilities.countryId` — SET NULL) | 422 وليس حذفاً صامتاً | ✅ مطابق (لأن العدّ يسبق الحذف) |
| 5 | حذف دولة مستخدمة كجنسية (`people.nationalityId` — بلا FK) | 422 | ✅ مطابق (بفضل العدّ التطبيقي) |
| 6 | `hr_manager` يحاول الحذف | 403 (الحذف admin فقط) | ✅ مطابق |
| 7 | حذف بلا توكن | 401 | ✅ مطابق (`country.security.test.ts` S2) |
| 8 | حذف معرّف غير موجود | 404 | ✅ مطابق |

## التحقق اليدوي
```sql
-- بعد حذف ناجح: الدولة اختفت والسجل بقي
SELECT count(*) FROM countries WHERE id = <id>;            -- 0
SELECT action FROM country_audit_log WHERE "countryId" = <id>;  -- create, delete
```

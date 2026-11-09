# GAP-FE-011 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `PUT` بالاسم الجديد + `version=1` | 200 + `version=2` + audit `update` | ✅ مطابق (`reference.test.ts`) |
| 2 | `PUT` بـ`version=99` | 409 ولا تغيير | ✅ مطابق (`reference.security.test.ts` S4) |
| 3 | `PUT` بلا `version` | 400 | ✅ مطابق (`reference.validation.test.ts`) |
| 4 | `PUT` بـ`version` فقط | 400 «لا توجد حقول للتعديل» | ✅ مطابق (`reference.validation.test.ts`) |
| 5 | تعديل سجل غير موجود | 404 | ✅ مطابق (`reference.extra.test.ts` S7) |
| 6 | تعديل باسم يطابق سجلاً آخر | 409 | ✅ مطابق (`reference.service` + `reference.extra.test.ts` S1) |
| 7 | `hr_staff` → `PUT` | 403 | ✅ مطابق (`reference.security.test.ts` S10) |

## الأثر
كل تعديل ناجح يزيد `version` بمقدار 1 ويكتب `oldValues`/`newValues` في
`reference_data_audit_log` (يُتحقق منه في `reference.extra.test.ts` S10).

# GAP-M-005 — التحقق

| السيناريو | المدخل | المتوقع | الفعلي |
|-----------|--------|---------|--------|
| 1 | `admin` → `POST /api/jobs` | 201 + `version=1` + audit `create` بـ`changedBy=admin.id` | ✅ مطابق |
| 2 | `hr_staff` → نفس النقطة | 403 ولا صف جديد | ✅ مطابق |
| 3 | عنوان مكرر (case-insensitive) | 409 «يوجد مسمى وظيفي آخر بنفس الاسم» | ✅ مطابق |
| 4 | cascade (سيناريو 10) | `GET /meta/salary-grades|cadres|classifications` → 200 وتحتوي الصفوف المُنشأة | ✅ مطابق |
| 5 | إنشاء مع المراجع الثلاثة | 201 + `salaryGrade.name`/`cadre.name`/`classification.name` صحيحة | ✅ مطابق |
| 6 | مرجع غير موجود (مثلاً `cadreId: 999999`) | 400 «المرجع المحدد غير موجود» | ✅ مطابق |
| 7 | `POST` مع `id`/`version` في الجسم | 400 + «حقل غير مسموح» | ✅ مطابق (`job.security.test.ts` S5) |
| 8 | حقن SQL في `title` | 201، يُخزَّن نصاً حرفياً، والجدول سليم | ✅ مطابق (S8) |

## ملاحظة البيانات
جداول `salary_grades`/`cadres`/`classifications` فارغة في `ihris_test_gap001`؛
الاختبارات تُنشئ صفوفاً ببادئة `gap4j` وتنظّفها.

# سكريبتات الترحيل (Migrations)

## نظرة عامة

تحتوي هذه المجلدات على سكريبتات ترحيل البيانات من النظام القديم (MySQL) إلى النظام الحديث (PostgreSQL).

## هيكل المجلدات

| المجلد | الغرض |
|--------|-------|
| `pending` | سكريبتات الترحيل المعلقة (لم يتم تنفيذها بعد) |
| `applied` | سكريبتات الترحيل المنفذة (تم تطبيقها على قاعدة البيانات) |
| `rollback` | سكريبتات التراجع (لإلغاء الترحيل إذا لزم الأمر) |

## سكريبت الترحيل الرئيسي

| الملف | المسار | الغرض |
|-------|-------|-------|
| `mysql-to-postgres.sql` | `D:\ihris-suite\ihris-modern\migrations\mysql-to-postgres.sql` | سكريبت ترحيل البيانات من MySQL إلى PostgreSQL |

## تحذير هام

> ⚠️ لا يتم تنفيذ أي أوامر SQL أو تعديل على قاعدة البيانات في مرحلة Sprint 0. جميع سكريبتات الترحيل موجودة للمراجعة فقط ولا يتم تنفيذها حتى الحصول على الموافقة الرسمية.

## خطة الترحيل المقترحة

| الترتيب | الجداول | السبب |
|---------|---------|-------|
| 1 | جداول المرجع (country, region, district, county, facility_type, job_type, position_status, salary_grade, cadre, classification, id_type, language, training_institution, training_course_status, training_course_category) | جداول مرجعية أساسية لا تعتمد على جداول أخرى |
| 2 | `user` | جداول المستخدمين تعتمد على roles |
| 3 | `user_access` | يربط المستخدمين بالأدوار |
| 4 | `permission` | الصلاحيات تعتمد على الأدوار |
| 5 | `person` | الأشخاص تعتمد على countries, districts, counties |
| 6 | `facility` | المنشآت تعتمد على countries, regions, districts, counties, facility_types |
| 7 | `job` | الوظائف تعتمد على salary_grades, cadres, classifications |
| 8 | `department` | الأقسام مستقلة |
| 9 | `position` | الوظائف الشاغرة تعتمد على jobs, facilities, departments, job_types, position_statuses, positions (self) |
| 10 | `contact` | الاتصالات تعتمد على الأشخاص |
| 11 | `demographic` | البيانات الديموغرافية تعتمد على الأشخاص |
| 12 | `person_id` | بطاقات الهوية تعتمد على الأشخاص و id_types |
| 13 | `person_language` | لغات الأشخاص تعتمد على الأشخاص و languages |
| 14 | `person_competency` | كفاءات الأشخاص تعتمد على الأشخاص و competency_types و competencies |
| 15 | `salary` | الرواتب تعتمد على الأشخاص |
| 16 | `employment` | التوظيف السابق يعتمد على الأشخاص |
| 17 | `education` | التعليم يعتمد على الأشخاص |
| 18 | `benefit` | المزايا تعتمد على الأشخاص |
| 19 | `application` | طلبات التوظيف تعتمد على الأشخاص والوظائف |
| 20 | `training_course` | الدورات التدريبية تعتمد على training_institutions, training_course_statuses, training_course_categories |
| 21 | `scheduled_training_course` | الدورات المجدولة تعتمد على training_courses, countries, regions, districts, counties |
| 22 | `person_scheduled_training_course` | تدريب الأشخاص المجدول يعتمد على الأشخاص و scheduled_training_courses |
| 23 | `position_decision` | قرارات الوظائف تعتمد على المناصب |
| 24 | `position_interview` | مقابلات الوظائف تعتمد على المناصب |
| 25 | `note` | الملاحظات تعتمد على الأشخاص |
| 26 | `form`, `field`, `form_field` | النماذج الديناميكية |
| 27 | `record` | السجلات تعتمد على النماذج |
| 28 | `entry` | entrées تعتمد على السجلات و ربط النموذج-الحقل |
| 29 | `last_entry` | آخر entrées تعتمد على السجلات و ربط النموذج-الحقل |
| 30 | `config` | إعدادات النظام |

## التحقق من سلامة الترحيل

| الاختبار | الوصف | المعايير المقبولة |
|---------|-------|-----------------|
| اختبار عدد السجلات | مقارنة عدد السجلات في كل جدول بين النظامين القديم والحديث | عدد السجلات يجب أن يتطابق |
| اختبار سلامة البيانات | مقارنة عينة من البيانات بين النظامين القديم والحديث | البيانات يجب أن تكون متطابقة |
| اختبار العلاقات | التحقق من صحة العلاقات الخارجية بين الجداول | جميع العلاقات الخارجية يجب أن تكون صالحة |
| اختبار الأداء | قياس وقت استعلام البيانات في النظام الحديث | وقت الاستجابة يجب أن يكون مقبولاً |
| اختبار واجهة المستخدم | التحقق من ظهور البيانات بشكل صحيح في واجهة المستخدم | البيانات يجب أن تظهر بشكل صحيح |

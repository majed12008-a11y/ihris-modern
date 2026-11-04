# جرد قاعدة بيانات النظام القديم (IHRIS Legacy)

## 1. نظرة عامة

| الخاصية | القيمة |
|---------|--------|
| اسم قاعدة البيانات | `ihris_manage` |
| نوع التصدير | phpMyAdmin SQL Dump versión 3.0.0 |
| إصدار MySQL المصدر | 5.0.51 |
| تاريخ التصدير | 02 نوفمبر 2026 |
| ترميز قاعدة البيانات | latin1 (بعض الجداول utf8) |
| عدد الجداول المكتشفة | 60+ جدول (في ihris_manage فقط) |

## 2. قوائم الجداول حسب الفئة

### 2.1 جداول النظام الأساسية (Core System Tables)

| # | اسم الجدول | السطر في الملف | المحرك | الغرض |
|---|------------|---------------|--------|-------|
| 1 | `access` | 26 | InnoDB | ربط المستخدمين بالأدوار (user, role) |
| 2 | `config` | 48 | InnoDB | إعدادات النظام والتقارير المخصصة (key-value) |
| 3 | `deleted_record` | 14347 | InnoDB | سجلات محذوفة (id, last_modified, form, parent) |
| 4 | `entry` | 14368 | InnoDB | قيم الحقول الديناميكية للسجلات (EAV values) |
| 5 | `field` | 49660 | InnoDB | تعريف الحقول (168 حقل، أنواع: string, integer, date, text) |
| 6 | `field_sequence` | 49809 | InnoDB | ترتيب الحقول في النماذج |
| 7 | `form` | 49827 | InnoDB | تعريف النماذج (64 نموذج) |
| 8 | `form_field` | 49900 | InnoDB | ربط الحقول بالنماذج (310 ربط) |
| 9 | `record` | 91366 | InnoDB | السجلات الفعلية (مع parent للعلاقات hiérarchique) |
| 10 | `last_entry` | 56725 | InnoDB | نسخة مخبأة من آخر إدخال لكل حقل |
| 11 | `user` | 96800 | MyISAM | المستخدمين (id, username, password MD5, firstname, lastname, email, creator) |
| 12 | `user_log` | 96827 | MyISAM | سجلات الدخول والخروج والنشاط |

### 2.2 جداول البيانات الثابتة المرجعية (Reference Data — hippo_*)

| # | اسم الجدول | السطر في الملف | المحرك | الغرض |
|---|------------|---------------|--------|-------|
| 13 | `hippo_benefit` | 50134 | InnoDB | المزايا |
| 14 | `hippo_benefit_type` | 50162 | InnoDB | أنواع المزايا |
| 15 | `hippo_cadre` | 50187 | InnoDB | الفئات الوظيفية |
| 16 | `hippo_classification` | 50212 | InnoDB | التصنيفات الوظيفية |
| 17 | `hippo_competency` | 50241 | InnoDB | الكفاءات |
| 18 | `hippo_competency_evaluation` | 50294 | InnoDB | تقييمات الكفاءات |
| 19 | `hippo_competency_type` | 50314 | InnoDB | أنواع الكفاءات |
| 20 | `hippo_contact` | 50350 | InnoDB | معلومات الاتصال |
| 21 | `hippo_continuing_education` | 50398 | InnoDB | التعليم المستمر |
| 22 | `hippo_continuing_education_course` | 50421 | InnoDB | دورات التعليم المستمر |
| 23 | `hippo_country` | 50445 | InnoDB | الدول |
| 24 | `hippo_county` | 50484 | InnoDB | المديريات |
| 25 | `hippo_currency` | 50511 | InnoDB | العملات |
| 26 | `hippo_degree` | 50539 | InnoDB | الشهادات العلمية |
| 27 | `hippo_demographic` | 50572 | InnoDB | البيانات الديموغرافية |
| 28 | `hippo_department` | 51592 | InnoDB | الأقسام |
| 29 | `hippo_district` | 51635 | InnoDB | المحافظات |
| 30 | `hippo_edu_type` | 51701 | InnoDB | أنواع التعليم |
| 31 | `hippo_education` | 51727 | InnoDB | الشهادات والمؤهلات التعليمية |
| 32 | `hippo_employment` | 51756 | InnoDB | التوظيف السابق |
| 33 | `hippo_facility` | 51790 | InnoDB | المنشآت الصحية |
| 34 | `hippo_facility_type` | 51831 | InnoDB | أنواع المنشآت |
| 35 | `hippo_id_type` | 51859 | InnoDB | أنواع بطاقات الهوية |
| 36 | `hippo_job` | 51884 | InnoDB | الوظائف |
| 37 | `hippo_language` | 51960 | InnoDB | اللغات |
| 38 | `hippo_marital_status` | 51992 | InnoDB | الحالة الاجتماعية |
| 39 | `hippo_notes` | 52018 | InnoDB | الملاحظات |
| 40 | `hippo_person` | 52043 | InnoDB | الأشخاص (الجدول الأساسي) |
| 41 | `hippo_person_competency` | 53073 | InnoDB | كفاءات الأشخاص |
| 42 | `hippo_person_id` | 53101 | InnoDB | بطاقات هوية الأشخاص |
| 43 | `hippo_person_language` | 53127 | InnoDB | لغات الأشخاص |
| 44 | `hippo_person_position` | 53155 | InnoDB | ارتباط الأشخاص بالوظائف |
| 45 | `hippo_person_scheduled_training_course` | 54186 | InnoDB | تدريب الأشخاص المجدول |
| 46 | `hippo_pos_change_reason` | 54216 | InnoDB | أسباب تغيير الوظيفة |
| 47 | `hippo_position` | 54246 | InnoDB | الوظائف الشاغرة |
| 48 | `hippo_position_select` | 55283 | InnoDB | تحديد الوظائف |
| 49 | `hippo_position_type` | 55303 | InnoDB | أنواع الوظائف |
| 50 | `hippo_region` | 55328 | InnoDB | المناطق |
| 51 | `hippo_salary` | 55369 | InnoDB | الرواتب |
| 52 | `hippo_salary_grade` | 56406 | InnoDB | درجات الرواتب |
| 53 | `hippo_salary_source` | 56436 | InnoDB | مصادر الرواتب |
| 54 | `hippo_scheduled_training_course` | 56464 | InnoDB | الدورات التدريبية المجدولة |
| 55 | `hippo_search` | 56496 | InnoDB | البحث |
| 56 | `hippo_training_course` | 56515 | InnoDB | الدورات التدريبية |
| 57 | `hippo_training_course_category` | 56547 | InnoDB | تصنيفات الدورات |
| 58 | `hippo_training_course_competency_evaluation` | 56573 | InnoDB | تقييم كفاءات الدورات |
| 59 | `hippo_training_course_evaluation` | 56600 | InnoDB | تقييمات الدورات |
| 60 | `hippo_training_course_requestor` | 56624 | InnoDB | طالبي الدورات |
| 61 | `hippo_training_course_status` | 56650 | InnoDB | حالات الدورات |
| 62 | `hippo_training_funder` | 56673 | InnoDB | ممولي التدريب |
| 63 | `hippo_training_institution` | 56698 | InnoDB | مؤسسات التدريب |

### 2.3 جداول التقارير الإحصائية (Zebra Tables)

| # | اسم الجدول | السطر في الملف | المحرك | الغرض |
|---|------------|---------------|--------|-------|
| 64 | `zebra_facility_list` | 96867 | InnoDB | قائمة المنشآت (تقرير) |
| 65 | `zebra_position_list` | 96916 | InnoDB | قائمة الوظائف (تقرير) |
| 66 | `zebra_staff_chart` | 97961 | InnoDB | الهيكل التنظيمي للموظفين (تقرير) |
| 67 | `zebra_staff_list` | 99007 | InnoDB | قائمة الموظفين (تقرير) |

## 3. detailed Table Analysis

### 3.1 جدول `form` (تعريف النماذج)

| السمة | القيمة |
|-------|-------|
| الأعمدة | id (int, PK), name (varchar 50, unique), type (tinyint) |
| عدد السجلات | 64 نموذج |
| أمثلة على النماذج | cadre, classification, salary_grade, job, country, region, district, county, edu_type, degree, position_type, salary_source, language, id_type, facility_type, pos_change_reason, benefit_type, facility, competency_type, competency, department, contact, person_id, education, employment, application, currency, marital_status, notes, benefit, position_interview, position_decision, person_language, person_competency, position, person, demographic, person_position, salary, competency_evaluation, continuing_education_course, continuing_education, training_funder, training_institution, training_course_requestor, training_course_competency_evaluation, person_scheduled_training_course, training_course_evaluation, scheduled_training_course, training_course, training_course_status, training_course_category |

### 3.2 جدول `field` (تعريف الحقول)

| السمة | القيمة |
|-------|-------|
| الأعمدة | id (int, PK), name (varchar 50), type (varchar 16) |
| التقييد الفريد | name_type (name + type) |
| عدد السجلات | 168 حقل |
| أنواع الحقول | string, integer, date, text |
| أمثلة على الحقول | surname, firstname, othername, nationality, residence_country, birth_date, gender, marital_status, id_type, id_num, code, title, description, facility, department, job, salary_grade, pos_type, status, start_date, end_date, proposed_salary, source, supervisor, comments, interview_comments, phone, email, address, notes, etc. |

### 3.3 جدول `form_field` (ربط الحقول بالنماذج)

| السمة | القيمة |
|-------|-------|
| الأعمدة | id (int, PK), form (int, FK), field (int, FK) |
| التقييد الفريد | form (form + field) |
| عدد السجلات | 310 ربط |
| الغرض | تحديد أي الحقول تنتمي إلى أي نموذج |

### 3.4 جدول `record` (السجلات الفعلية)

| السمة | القيمة |
|-------|-------|
| الأعمدة | id (int, PK, auto_increment), last_modified (datetime), form (int, FK to form), parent (int, nullable, self-reference) |
| عدد السجلات | 15,428+ سجل (مبدئي) |
| الغرض | تخزين السجلات الفعلية لكل نموذج، مع دعم العلاقات الهرمية عبر parent |

### 3.5 جدول `entry` (قيم الحقول الديناميكية — EAV)

| السمة | القيمة |
|-------|-------|
| الأعمدة | record (int, FK), form_field (int, FK), date (datetime), who (int, user id), change_type (tinyint), string_value (varchar 255), integer_value (int), text_value (text), date_value (datetime), blob_value (longblob) |
| الفهارس | record, date, form_field |
| الغرض | تخزين قيم الحقول dynamically لكل سجل (نمط EAV) |

### 3.6 جدول `last_entry` (آخر إدخال مخبأ)

| السمة | القيمة |
|-------|-------|
| الأعمدة | record (int, PK), form_field (int, PK), date (datetime), who (int), change_type (tinyint), string_value, integer_value, text_value, date_value, blob_value |
| الغرض | الوصول السريع لآخر قيمة لكل حقل في كل سجل |

### 3.7 جدول `user` (المستخدمين)

| السمة | القيمة |
|-------|-------|
| الأعمدة | id (int, PK, auto_increment), username (varchar 20, unique), password (varchar 50, MD5), firstname (varchar 50), lastname (varchar 100), email (varchar 100), creator (int) |
| عدد السجلات | 55 (مبدئي، AUTO_INCREMENT=55) |
| أمثلة على السجلات | administrator (id=1), Majed (id=54) |

### 3.8 جدول `access` (الأدوار)

| السمة | القيمة |
|-------|-------|
| الأعمدة | user (int, PK), role (varchar 255) |
| عدد السجلات | 3+ |
| أمثلة | (1, 'admin'), (53, 'admin'), (54, 'adm') |

### 3.9 جدول `user_log` (سجل النشاط)

| السمة | القيمة |
|-------|-------|
| الأعمدة | user (int), login (datetime), logout (datetime), session_id (varchar 50), activity (datetime) |
| الغرض | تتبع جلسات المستخدمين والنشاط |

### 3.10 جدول `config` (إعدادات النظام)

| السمة | القيمة |
|-------|-------|
| الأعمدة | hash (char 32, PK), path (text), type (tinyint), value (text utf8), children (text) |
| الغرض | إعدادات النظام والتقارير المخصصة بنمط key-value |
| أمثلة على المسارات | config:modules/CustomReports/*, config:modules/forms/formClasses/*, config:config/data/*, config:I2CE/tasks/* |

## 4. إحصاءات أولية

| البند | القيمة |
|-------|--------|
| عدد الجداول في ihris_manage | 67+ جدول |
| عدد النماذج (form) | 64 نموذج |
| عدد الحقول (field) | 168 حقل |
| عدد ربط الحقول بالنماذج (form_field) | 310 ربط |
| عدد السجلات (record) | 15,428+ |
| عدد المستخدمين | 55 (مبدئي) |
| عدد الأدوار | 3+ (admin, adm) |

## 5. ملاحظات

- النظام يستخدم **نمط EAV (Entity-Attribute-Value)** للبيانات الديناميكية عبر جداول form/field/form_field/record/entry.
- جداول `hippo_*` تحتوي على بيانات ثابتة للبيانات المرجعية.
- جداول `zebra_*` تحتوي على بيانات تقارير إحصائية مسبقة الحساب.
- جدول `config` يحتوي على إعدادات النظام والتقارير المخصصة (Custom Reports).
- كلمات المرور مخزنة بـ **MD5 hash**.
- جداول المستخدمين والسجل تستخدم محرك **MyISAM**، بينما الجداول الأخرى تستخدم **InnoDB**.

## 6. مصفوفة الأدلة

| العنصر | المصدر | مستوى الثقة |
|--------|---------|-------------|
| قائمة الجداول | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| أعمدة كل جدول | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| أنواع البيانات | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| العلاقات (FK) | 분석 يدوي لأسماء الأعمدة | مرجحة |
| عدد السجلات | 명령 INSERT في ملف SQL | مؤكدة |
| الغرض من كل جدول | تحليل الاسم والبنية | مرجحة |

---

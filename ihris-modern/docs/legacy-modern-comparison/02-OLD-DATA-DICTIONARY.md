# قاموس البيانات القديم (IHRIS Legacy Data Dictionary)

## 1. نموذج البيانات العام

النظام القديم يستخدم نموذجين intertwined:

1. **نموذج EAV (Entity-Attribute-Value)** للبيانات الديناميكية عبر جداول: `form`, `field`, `form_field`, `record`, `entry`, `last_entry`
2. **نموذج 관계بي ثابت (Fixed Relational)** للبيانات المرجعية عبر جداول: `hippo_*`

---

## 2. جداول النظام الأساسية (Core System Tables)

### 2.1 جدول `form` — تعريف النماذج

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | int(10) unsigned | NO | auto_increment | معرف النموذج (مفتاح أساسي) |
| name | varchar(50) | NO | — | اسم النموذج (مUnique) |
| type | tinyint(3) unsigned | NO | — | نوع النموذج |

**الفهارس:** PRIMARY KEY (id), UNIQUE KEY (name)

**النماذج المسجلة (64 نموذج):**
cadre, classification, salary_grade, job, country, region, district, county, edu_type, degree, position_type, salary_source, language, id_type, facility_type, pos_change_reason, benefit_type, facility, competency_type, competency, department, contact, person_id, education, employment, application, currency, marital_status, notes, benefit, position_interview, position_decision, person_language, person_competency, position, person, demographic, person_position, salary, competency_evaluation, continuing_education_course, continuing_education, training_funder, training_institution, training_course_requestor, training_course_competency_evaluation, person_scheduled_training_course, training_course_evaluation, scheduled_training_course, training_course, training_course_status, training_course_category

---

### 2.2 جدول `field` — تعريف الحقول

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | int(10) unsigned | NO | auto_increment | معرف الحقل (مفتاح أساسي) |
| name | varchar(50) | NO | — | اسم الحقل |
| type | varchar(16) | NO | — | نوع الحقل (string, integer, date, text) |

**الفهارس:** PRIMARY KEY (id), UNIQUE KEY name_type (name, type)

**أنواع الحقول المدعومة:** string, integer, date, text

**أمثلة على الحقول:**
- surname, firstname, othername (string)
- birth_date, start_date, end_date, year, date, date_added, proposed_end_date, proposed_hiring_date, request_date, evaluation_date (date)
- gender, marital_status, id_type, id_num, nationality, residence_country, residence_district, residence_county (mixed integer/string)
- code, title, description, facility, department, job, salary_grade, pos_type, status, source, supervisor, comments, interview_comments, phone, email, address, notes, etc.

---

### 2.3 جدول `form_field` — ربط الحقول بالنماذج

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | int(10) unsigned | NO | auto_increment | معرف الربط (مفتاح أساسي) |
| form | int(10) unsigned | NO | — | معرف النموذج (مفتاح خارجي إلى form.id) |
| field | int(10) unsigned | NO | — | معرف الحقل (مفتاح خارجي إلى field.id) |

**الفهارس:** PRIMARY KEY (id), UNIQUE KEY form (form, field)

**عدد الروابط:** 310 ربط

---

### 2.4 جدول `record` — السجلات الفعلية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | int(10) unsigned | NO | auto_increment | معرف السجل (مفتاح أساسي) |
| last_modified | datetime | NO | — | آخر تعديل |
| form | int(10) unsigned | NO | — | معرف النموذج (مفتاح خارجي إلى form.id) |
| parent | int(10) unsigned | YES | NULL | معرف السجل الأب (علاقة هرمية ذاتية) |

**الفهارس:** PRIMARY KEY (id), KEY parent (parent)

**عدد السجلات:** 15,428+ (مبدئي)

---

### 2.5 جدول `entry` — قيم الحقول الديناميكية (EAV)

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| record | int(10) unsigned | NO | — | معرف السجل (مفتاح خارجي إلى record.id) |
| form_field | int(10) unsigned | NO | — | معرف الربط بين النموذج والحقل (مفتاح خارجي إلى form_field.id) |
| date | datetime | NO | — | تاريخ الإدخال |
| who | int(10) unsigned | NO | — | معرف المستخدم الذي أجرى التغيير |
| change_type | tinyint(3) unsigned | NO | — | نوع التغيير |
| string_value | varchar(255) | YES | NULL | القيمة النصية القصيرة |
| integer_value | int(11) | YES | NULL | القيمة العددية |
| text_value | text | YES | NULL | القيمة النصية الطويلة |
| date_value | datetime | YES | NULL | القيمة التاريخية |
| blob_value | longblob | YES | NULL | القيمة الثنائية |

**الفهارس:** KEY record (record), KEY date (date), KEY form_field (form_field)

---

### 2.6 جدول `last_entry` — آخر إدخال مخبأ

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| record | int(10) unsigned | NO | — | معرف السجل (جزء من المفتاح الأساسي المركب) |
| form_field | int(10) unsigned | NO | — | معرف الربط (جزء من المفتاح الأساسي المركب) |
| date | datetime | NO | — | تاريخ الإدخال |
| who | int(10) unsigned | NO | — | معرف المستخدم |
| change_type | tinyint(3) unsigned | NO | — | نوع التغيير |
| string_value | varchar(255) | YES | NULL | القيمة النصية القصيرة |
| integer_value | int(11) | YES | NULL | القيمة العددية |
| text_value | text | YES | NULL | القيمة النصية الطويلة |
| date_value | datetime | YES | NULL | القيمة التاريخية |
| blob_value | longblob | YES | NULL | القيمة الثنائية |

**الفهارس:** PRIMARY KEY (record, form_field)

---

## 3. جداول البيانات المرجعية المرجعية (Reference Data — hippo_*)

### 3.1 جدول `hippo_person` — الأشخاص (الجدول الأساسي)

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int(10) unsigned | NO | معرف الشخص (مفتاح أساسي) |
| parent | int(11) | YES, default 0 | معرف الشخص الأب (علاقة هرمية) |
| surname | varchar(255) utf8 | YES | اللقب (الاسم الأخير) |
| firstname | varchar(255) utf8 | YES | الاسم الأول |
| othername | varchar(255) utf8 | YES | الأسماء الأخرى |
| nationality | int(11) | YES | الجنسية (مفتاح خارجي إلى hippo_country) |
| residence_country | int(11) | YES | دولة الإقامة |
| residence_district | int(11) | YES | محافظة الإقامة |
| residence_county | int(11) | YES | مديرية الإقامة |

**الفهارس:** PRIMARY KEY (id), KEY parent (parent)

---

### 3.2 جدول `hippo_position` — الوظائف الشاغرة

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int(10) unsigned | NO | معرف الوظيفة (مفتاح أساسي) |
| code | varchar | YES | كود الوظيفة |
| title | varchar | YES | المسمى الوظيفي |
| description | text | YES | الوصف |
| proposed_salary | varchar | YES | الراتب المقترح |
| source | varchar | YES | المصدر |
| supervisor | int | YES | المشرف (مفتاح خارجي إلى hippo_position.id) |
| facility | int | YES | المنشأة (مفتاح خارجي إلى hippo_facility) |
| department | int | YES | القسم (مفتاح خارجي إلى hippo_department) |
| pos_type | int | YES | نوع الوظيفة (مفتاح خارجي إلى hippo_position_type) |
| proposed_end_date | date | YES | تاريخ الانتهاء المقترح |
| proposed_hiring_date | date | YES | تاريخ التوظيف المقترح |
| status | int | YES | الحالة (مفتاح خارجي إلى hippo_pos_change_reason) |
| posted_date | date | YES | تاريخ النشر |
| comments | text | YES | التعليقات |
| interview_comments | text | YES | تعليقات المقابلة |

---

### 3.3 جدول `hippo_job` — الوظائف

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int | NO | معرف الوظيفة (مفتاح أساسي) |
| title | varchar | YES | المسمى الوظيفي |
| code | varchar | YES | كود الوظيفة |
| description | text | YES | الوصف |
| salary_grade | int | YES | درجة الراتب (مفتاح خارجي إلى hippo_salary_grade) |
| cadre | int | YES | الفئة الوظيفية (مفتاح خارجي إلى hippo_cadre) |
| classification | int | YES | التصنيف الوظيفي (مفتاح خارجي إلى hippo_classification) |

---

### 3.4 جدول `hippo_facility` — المنشآت الصحية

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int | NO | معرف المنشأة (مفتاح أساسي) |
| name | varchar | YES | اسم المنشأة |
| facility_type | int | YES | نوع المنشأة (مفتاح خارجي إلى hippo_facility_type) |
| district | int | YES | المحافظة (مفتاح خارجي إلى hippo_district) |
| county | int | YES | المديرية (مفتاح خارجي إلى hippo_county) |
| country | int | YES | الدولة (مفتاح خارجي إلى hippo_country) |
| region | int | YES | المنطقة (مفتاح خارجي إلى hippo_region) |

---

### 3.5 جدول `hippo_salary` — الرواتب

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int | NO | معرف الراتب (مفتاح أساسي) |
| person | int | YES | معرف الشخص (مفتاح خارجي إلى hippo_person) |
| start_date | date | YES | تاريخ البدء |
| end_date | date | YES | تاريخ الانتهاء |
| salary | varchar | YES | قيمة الراتب |
| notes | text | YES | ملاحظات |

---

## 4. جداول التدريب (Training Tables)

### 4.1 جدول `hippo_training_course` — الدورات التدريبية

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int | NO | معرف الدورة (مفتاح أساسي) |
| name | varchar | YES | اسم الدورة |
| topic | text | YES | الموضوع |
| notes | text | YES | ملاحظات |
| training_institution | int | YES | مؤسسة التدريب (مفتاح خارجي إلى hippo_training_institution) |
| training_funder | varchar | YES | الممول |
| continuing_education_course | varchar | YES | دورة التعليم المستمر |
| training_course_status | int | YES | حالة الدورة (مفتاح خارجي إلى hippo_training_course_status) |
| training_course_category | int | YES | تصنيف الدورة (مفتاح خارجي إلى hippo_training_course_category) |
| competency | varchar | YES | الكفاءة |

---

### 4.2 جدول `hippo_scheduled_training_course` — الدورات المجدولة

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int | NO | معرف الدورة المجدولة (مفتاح أساسي) |
| training_course | int | YES | معرف الدورة (مفتاح خارجي إلى hippo_training_course) |
| site | varchar | YES | موقع الدورة |
| num_students | int | YES | عدد الطلاب |
| notes | text | YES | ملاحظات |
| instructors | varchar | YES | المدربون |
| start_date | date | YES | تاريخ البدء |
| end_date | date | YES | تاريخ الانتهاء |
| country | int | YES | الدولة |
| district | int | YES | المحافظة |
| county | int | YES | المديرية |

---

### 4.3 جدول `hippo_person_scheduled_training_course` — تدريب الأشخاص المجدول

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| id | int | NO | معرف السجل (مفتاح أساسي) |
| person | int | YES | معرف الشخص (مفتاح خارجي إلى hippo_person) |
| scheduled_training_course | int | YES | معرف الدورة المجدولة (مفتاح خارجي إلى hippo_scheduled_training_course) |
| is_retraining | int | YES | هل هو إعادة تدريب |
| completed | int | YES | هل أكمل |
| request_date | date | YES | تاريخ الطلب |
| notes | text | YES | ملاحظات |
| training_course_evaluation | int | YES | تقييم الدورة (مفتاح خارجي) |
| training_course_requestor | int | YES | طالب الدورة (مفتاح خارجي) |
| training_course | int | YES | معرف الدورة (مفتاح خارجي) |

---

## 5. جداول المستخدمين والصلاحية

### 5.1 جدول `user` — المستخدمين

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | int(11) | NO | auto_increment | معرف المستخدم (مفتاح أساسي) |
| username | varchar(20) | NO | — | اسم المستخدم (مUnique) |
| password | varchar(50) | NO | — | كلمة المرور (MD5 hash) |
| firstname | varchar(50) | NO | — | الاسم الأول |
| lastname | varchar(100) | NO | — | اسم العائلة |
| email | varchar(100) | YES | NULL | البريد الإلكتروني |
| creator | int(11) | NO | — | معرف المنشئ |

**الفهارس:** PRIMARY KEY (id), UNIQUE KEY username (username)

**عدد السجلات:** 55 (مبدئي)

**أمثلة:**
- (1, 'administrator', '330c0db82cab2fd53568cd5743fa973d', 'Site', 'Administrator', 'moh_it@moh.gov.ye', 0)
- (54, 'Majed', '330c0db82cab2fd53568cd5743fa973d', 'ماجد', 'الحداد', 'moh1@moh.org.ye', 1)

---

### 5.2 جدول `access` — الأدوار والصلاحية

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| user | int(11) | NO | معرف المستخدم (مفتاح أساسي) |
| role | varchar(255) | NO | اسم الدور |

**الفهارس:** PRIMARY KEY (user)

**عدد السجلات:** 3+ 
**الأدوار المسجلة:** admin, adm

---

### 5.3 جدول `user_log` — سجل النشاط

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| user | int(11) | NO | معرف المستخدم (مفتاح خارجي إلى user.id) |
| login | datetime | NO | تاريخ تسجيل الدخول |
| logout | datetime | YES | تاريخ تسجيل الخروج |
| session_id | varchar(50) | NO | معرف الجلسة |
| activity | datetime | NO | تاريخ النشاط |

**الفهارس:** KEY user (user), KEY login (login)

---

## 6. جداول التقارير الإحصائية (Zebra Tables)

### 6.1 جدول `zebra_facility_list` — قائمة المنشآت (تقرير)

| العمود | النوع | الوصف |
|--------|-------|-------|
| (بنية الجدول غير مكتملة في الجزء المقروء) | | |

### 6.2 جدول `zebra_position_list` — قائمة الوظائف (تقرير)

| العمود | النوع | الوصف |
|--------|-------|-------|
| (بنية الجدول غير مكتملة في الجزء المقروء) | | |

### 6.3 جدول `zebra_staff_chart` — الهيكل التنظيمي للموظفين (تقرير)

| العمود | النوع | الوصف |
|--------|-------|-------|
| (بنية الجدول غير مكتملة في الجزء المقروء) | | |

### 6.4 جدول `zebra_staff_list` — قائمة الموظفين (تقرير)

| العمود | النوع | الوصف |
|--------|-------|-------|
| (بنية الجدول غير مكتملة في الجزء المقروء) | | |

---

## 7. جدول الإعدادات `config`

| العمود | النوع | قابلية NULL | الوصف |
|--------|-------|-------------|-------|
| hash | char(32) | NO | معرف الإعداد (مفتاح أساسي، MD5 hash) |
| path | text | NO | مسار الإعداد (مثال: config:modules/CustomReports/*) |
| type | tinyint(4) | NO | نوع القيمة (0 أو 1) |
| value | text utf8 | YES | قيمة الإعداد |
| children | text | YES | قيم الأطفال (مفصولة بفواصل) |

**أمثلة على المسارات:**
- `config:modules/CustomReports/reportViews/facility_list/fields/primary_form+name`
- `config:modules/forms/formClasses/iHRIS_ManageDemographic/fields/dependents`
- `config:config/data/ihris-plan-sample-data/version`
- `config:I2CE/tasks/task_trickle_down/can_edit_database_lists/0`

---

## 8. العلاقات (Relationships)

### 8.1 العلاقات الأساسية في جداول hippo_*

| الجدول الأب | العمود | الجدول الابن | العمود | نوع العلاقة |
|------------|--------|-------------|--------|-------------|
| hippo_country | id | hippo_district | country_id | One-to-Many |
| hippo_country | id | hippo_facility | country_id | One-to-Many |
| hippo_district | id | hippo_county | district_id | One-to-Many |
| hippo_district | id | hippo_facility | district_id | One-to-Many |
| hippo_county | id | hippo_facility | county_id | One-to-Many |
| hippo_region | id | hippo_facility | region_id | One-to-Many |
| hippo_facility_type | id | hippo_facility | facility_type_id | One-to-Many |
| hippo_job | id | hippo_position | job_id | One-to-Many |
| hippo_salary_grade | id | hippo_job | salary_grade_id | One-to-Many |
| hippo_cadre | id | hippo_job | cadre_id | One-to-Many |
| hippo_classification | id | hippo_job | classification_id | One-to-Many |
| hippo_position | id | hippo_position | supervisor_id | One-to-Many (ذاتية) |
| hippo_position_type | id | hippo_position | pos_type_id | One-to-Many |
| hippo_pos_change_reason | id | hippo_position | status_id | One-to-Many |
| hippo_person | id | hippo_person_id | person_id | One-to-Many |
| hippo_person | id | hippo_contact | person_id | One-to-Many |
| hippo_person | id | hippo_demographic | person_id | One-to-Many |
| hippo_person | id | hippo_salary | person_id | One-to-Many |
| hippo_person | id | hippo_employment | person_id | One-to-Many |
| hippo_person | id | hippo_education | person_id | One-to-Many |
| hippo_person | id | hippo_benefit | person_id | One-to-Many |
| hippo_person | id | hippo_person_language | person_id | One-to-Many |
| hippo_person | id | hippo_person_competency | person_id | One-to-Many |
| hippo_person | id | hippo_person_position | person_id | One-to-Many |
| hippo_position | id | hippo_person_position | position_id | One-to-Many |
| hippo_position | id | hippo_position_decision | position_id | One-to-Many |
| hippo_position | id | hippo_position_interview | position_id | One-to-Many |

### 8.2 العلاقات في نموذج EAV

| الجدول | العمود | الجدول المرتبط | العمود | نوع العلاقة |
|--------|--------|-------------|--------|-------------|
| form | id | form_field | form | One-to-Many |
| field | id | form_field | field | One-to-Many |
| form | id | record | form | One-to-Many |
| record | id | record | parent | One-to-Many (ذاتية) |
| record | id | entry | record | One-to-Many |
| form_field | id | entry | form_field | One-to-Many |
| record | id | last_entry | record | One-to-One |

---

## 9. قواعد العمل المستنتجة من البنية

### 9.1 قواعد صحة البيانات (Data Integrity)

| القاعدة | الوصف | المصدر |
|--------|-------|---------|
| اسم النموذج فريد | كل نموذج يجب أن يكون له اسم فريد | UNIQUE KEY name في جدول form |
| مزيج اسم الحقل ونوعه فريد | لا يمكن تكرار نفس اسم الحقل بنفس النوع | UNIQUE KEY name_type في جدول field |
| ربط الحقل بالنموذج فريد | لا يمكن تكرار نفس الربط بين نموذج وحقل | UNIQUE KEY form في جدول form_field |
| اسم المستخدم فريد | لا يمكن تكرار اسم المستخدم | UNIQUE KEY username في جدول user |
| السجل يجب أن ينتمي لنموذج | كل سجل يجب أن يكون مرتبطًا بنموذج | NOT NULL على حقل form في جدول record |
| الإدخال يجب أن ينتمي لسجل وحقل | كل إدخال يجب أن يكون مرتبطًا بسجل وحقل معين | NOT NULL على حقلي record و form_field في جدول entry |

### 9.2 قواعد العلاقات (Relationship Rules)

| القاعدة | الوصف | المصدر |
|--------|-------|---------|
| السجل يمكن أن يكون له أب | يمكن أن يكون للسجل سجل أب للعلاقات الهرمية | حقل parent nullable في جدول record |
| الوظيفة يمكن أن يكون لها مشرف | يمكن أن يكون للوظيفة مشرف آخر (ذاتي) | حقل supervisor في جدول hippo_position |
| الشخص يمكن أن يكون له وظائف متعددة | يمكن أن يرتبط الشخص بعدة وظائف عبر hippo_person_position | علاقة One-to-Many في جدول hippo_person_position |
| الدورة يمكن أن يكون لها متدربون متعددون | يمكن أن يكون للدورة المجدولة متدربون متعددون | علاقة One-to-Many في جدول hippo_person_scheduled_training_course |

### 9.3 قواعد الحالات (Status Rules)

| القاعدة | الوصف | المصدر |
|--------|-------|---------|
| تغيير نوع التغيير | tipo التغيير يحدد نوع العملية (إضافة، تعديل، حذف) | حقل change_type في جدول entry |
| تغيير حالة الوظيفة | حالة الوظيفة تحدد ما إذا كانت شاغرة أو مشغولة | حقل status في جدول hippo_position |
| حالة الدورة | حالة الدورة تحدد ما إذا كانت مجدولة أو مكتملة أو ملغاة | حقل training_course_status في جدول hippo_training_course |

---

## 10. مصفوفة الأدلة

| العنصر | المصدر | مستوى الثقة |
|--------|---------|-------------|
| قائمة الجداول | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| أعمدة كل جدول | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| أنواع البيانات | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| العلاقات (FK) | تحليل يدوي لأسماء الأعمدة | مرجحة |
| قواعد العمل | تحليل القيود (NOT NULL, UNIQUE, FK) | مؤكدة |
| الغرض من كل جدول | تحليل الاسم والبنية | مرجحة |

---

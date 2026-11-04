# خريطة الربط بين قواعد البيانات (Database Mapping)

## 1. نظرة عامة

توثق هذه الخريطة الربط بين جداول النظام القديم (iHRIS Legacy MySQL) وجداول النظام الحديث (IHRIS Modern PostgreSQL). يتم تصنيف كل جدول قديم إلى واحدة من الفئات التالية:

| التصنيف | الوصف |
|---------|-------|
| **مطابق完全ًا** | يوجد جدول مماثل في النظام الحديث بنفس الغرض والبنية |
| **أعيدت تسميته** | يوجد جدول مماثل ولكن باسم مختلف |
| **أعيد تصميمه** | يوجد جدول مماثل ولكن بتصميم مختلف (مثل من EAV إلى ثابت) |
| **تم تقسيمه** | تم تقسيم الجدول القديم إلى جدولين أو أكثر في النظام الحديث |
| **تم دمجه** | تم دمج جداول قديمة متعددة في جدول واحد في النظام الحديث |
| **تم إسقاطه** | لا يوجد جدول مقابل في النظام الحديث |
| **غير قابل للتحقق** | لا يمكن تحديد المقابل debido إلى نقص المعلومات |

---

## 2. خريطة الربط بالتفصيل

### 2.1 جداول النظام الأساسية (Core System Tables)

| الجدول القديم | الجدول الحديث | التصنيف | ملاحظات |
|-------------|-------------|----------|---------|
| `access` | `user_access` | مطابق تمامًا | ربط المستخدمين بالأدوار |
| `config` | `config` | مطابق تمامًا | إعدادات النظام (key-value) |
| `deleted_record` | `deleted_record` | مطابق تمامًا | السجلات المحذوفة |
| `entry` | `entry` | مطابق تمامًا | قيم الحقول الديناميكية (EAV) |
| `field` | `field` | مطابق تمامًا | تعريف الحقول |
| `field_sequence` | (غير موجود) | تم إسقاطه | لا يوجد جدول مماثل في النظام الحديث |
| `form` | `form` | مطابق تمامًا | تعريف النماذج |
| `form_field` | `form_field` | مطابق تمامًا | ربط الحقول بالنماذج |
| `last_entry` | `last_entry` | مطابق تمامًا | آخر إدخال مخبأ |
| `record` | `record` | مطابق تمامًا | السجلات الفعلية |
| `user` | `user` | مطابق تمامًا | المستخدمين |
| `user_log` | (غير موجود) | تم إسقاطه | لا يوجد جدول سجل نشاط في النظام الحديث |

### 2.2 جداول البيانات المرجعية (Reference Data — hippo_*)

| الجدول القديم | الجدول الحديث | التصنيف | ملاحظات |
|-------------|-------------|----------|---------|
| `hippo_benefit` | `benefit` | أعيدت تسميته | مزايا الأشخاص |
| `hippo_benefit_type` | (غير موجود) | تم دمجه | مدمج في نظام المزايا المبسط |
| `hippo_cadre` | `cadre` | أعيدت تسميته | الفئات الوظيفية |
| `hippo_classification` | `classification` | أعيدت تسميته | التصنيفات الوظيفية |
| `hippo_competency` | `competency` | أعيدت تسميته | الكفاءات |
| `hippo_competency_evaluation` | (غير موجود) | تم دمجه | مدمج في نظام التقييم المبسط |
| `hippo_competency_type` | `competency_type` | أعيدت تسميته | أنواع الكفاءات |
| `hippo_contact` | `contact` | أعيدت تسميته | معلومات الاتصال |
| `hippo_continuing_education` | (غير موجود) | تم إسقاطه | لا يوجد جدول للتعليم المستمر |
| `hippo_continuing_education_course` | (غير موجود) | تم إسقاطه | لا يوجد جدول لدورات التعليم المستمر |
| `hippo_country` | `country` | أعيدت تسميته | الدول |
| `hippo_county` | `county` | أعيدت تسميته | المديريات |
| `hippo_currency` | (غير موجود) | تم إسقاطه | لا يوجد جدول للعملات |
| `hippo_degree` | (غير موجود) | تم إسقاطه | لا يوجد جدول للشهادات العلمية |
| `hippo_demographic` | `demographic` | أعيدت تسميته | البيانات الديموغرافية |
| `hippo_department` | `department` | أعيدت تسميته | الأقسام |
| `hippo_district` | `district` | أعيدت تسميته | المحافظات |
| `hippo_edu_type` | (غير موجود) | تم إسقاطه | لا يوجد جدول لأنواع التعليم |
| `hippo_education` | `education` | أعيدت تسميته | التعليم والشهادات |
| `hippo_employment` | `employment` | أعيدت تسميته | التوظيف السابق |
| `hippo_facility` | `facility` | أعيدت تسميته | المنشآت الصحية |
| `hippo_facility_type` | `facility_type` | أعيدت تسميته | أنواع المنشآت |
| `hippo_id_type` | `id_type` | أعيدت تسميته | أنواع بطاقات الهوية |
| `hippo_job` | `job` | أعيدت تسميته | الوظائف |
| `hippo_language` | `language` | أعيدت تسميته | اللغات |
| `hippo_marital_status` | (غير موجود) | تم إسقاطه | لا يوجد جدول للحالة الاجتماعية |
| `hippo_notes` | `note` | أعيدت تسميته (مفرد) | الملاحظات |
| `hippo_person` | `person` | أعيدت تسميته | الأشخاص (الجدول الأساسي) |
| `hippo_person_competency` | `person_competency` | أعيدت تسميته | كفاءات الأشخاص |
| `hippo_person_id` | `person_id` | أعيدت تسميته | بطاقات هوية الأشخاص |
| `hippo_person_language` | `person_language` | أعيدت تسميته | لغات الأشخاص |
| `hippo_person_position` | `person_position` | أعيدت تسميته | ارتباط الأشخاص بالوظائف |
| `hippo_person_scheduled_training_course` | `person_scheduled_training_course` | أعيدت تسميته | تدريب الأشخاص المجدول |
| `hippo_pos_change_reason` | `position_status` | أعيدت تسميته | أسباب تغيير الوظيفة → حالات الوظائف |
| `hippo_position` | `position` | أعيدت تسميته | الوظائف الشاغرة |
| `hippo_position_select` | (غير موجود) | تم إسقاطه | لا يوجد جدول لتحديد الوظائف |
| `hippo_position_type` | `job_type` | أعيدت تسميته | أنواع الوظائف |
| `hippo_region` | `region` | أعيدت تسميته | المناطق |
| `hippo_salary` | `salary` | أعيدت تسميته | الرواتب |
| `hippo_salary_grade` | `salary_grade` | أعيدت تسميته | درجات الرواتب |
| `hippo_salary_source` | (غير موجود) | تم إسقاطه | لا يوجد جدول لمصادر الرواتب |
| `hippo_scheduled_training_course` | `scheduled_training_course` | أعيدت تسميته | الدورات المجدولة |
| `hippo_search` | (غير موجود) | تم إسقاطه | لا يوجد جدول للبحث |
| `hippo_training_course` | `training_course` | أعيدت تسميته | الدورات التدريبية |
| `hippo_training_course_category` | `training_course_category` | أعيدت تسميته | تصنيفات الدورات |
| `hippo_training_course_competency_evaluation` | (غير موجود) | تم إسقاطه | لا يوجد جدول لتقييم كفاءات الدورات |
| `hippo_training_course_evaluation` | (غير موجود) | تم إسقاطه | لا يوجد جدول لتقييمات الدورات |
| `hippo_training_course_requestor` | (غير موجود) | تم إسقاطه | لا يوجد جدول لطالبي الدورات |
| `hippo_training_course_status` | `training_course_status` | أعيدت تسميته | حالات الدورات |
| `hippo_training_funder` | (غير موجود) | تم إسقاطه | لا يوجد جدول لممولي التدريب |
| `hippo_training_institution` | `training_institution` | أعيدت تسميته | مؤسسات التدريب |

### 2.3 جداول التقارير الإحصائية (Zebra Tables)

| الجدول القديم | الجدول الحديث | التصنيف | ملاحظات |
|-------------|-------------|----------|---------|
| `zebra_facility_list` | (غير موجود) | تم إسقاطه | لا يوجد جدول تقارير إحصائية مسبقة |
| `zebra_position_list` | (غير موجود) | تم إسقاطه | لا يوجد جدول تقارير إحصائية مسبقة |
| `zebra_staff_chart` | (غير موجود) | تم إسقاطه | لا يوجد جدول تقارير إحصائية مسبقة |
| `zebra_staff_list` | (غير موجود) | تم إسقاطه | لا يوجد جدول تقارير إحصائية مسبقة |

---

## 3. خريطة الأعمدة للجداول الأساسية

### 3.1 جدول `user` → `user`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int(11) | Int | معرف المستخدم |
| username | username | varchar(20) | String (@db.VarChar(30)) | اسم المستخدم |
| password | password | varchar(50) | String (@db.VarChar(255)) | كلمة المرور (MD5 → bcrypt) |
| firstname | firstname | varchar(50) | String (@db.VarChar(255)) | الاسم الأول |
| lastname | lastname | varchar(100) | String (@db.VarChar(255)) | اسم العائلة |
| email | email | varchar(100) | String (@db.VarChar(255)) | البريد الإلكتروني |
| creator | creatorId | int(11) | Int | معرف المنشئ |
| (غير موجود) | createdAt | — | DateTime | تاريخ الإنشاء (جديد) |
| (غير موجود) | updatedAt | — | DateTime | تاريخ آخر تعديل (جديد) |

### 3.2 جدول `person` → `people`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int(10) unsigned | Int | معرف الشخص |
| parent | parent | int(11) | Int | معرف الشخص الأب |
| surname | surname | varchar(255) | String | اللقب |
| firstname | firstname | varchar(255) | String | الاسم الأول |
| othername | othername | varchar(255) | String | الأسماء الأخرى |
| nationality | nationalityId | int(11) | Int | الجنسية |
| residence_country | residenceCountryId | int(11) | Int | دولة الإقامة |
| residence_district | residenceDistrictId | int(11) | Int | محافظة الإقامة |
| residence_county | residenceCountyId | int(11) | Int | مديرية الإقامة |
| (غير موجود) | createdAt | — | DateTime | تاريخ الإنشاء (جديد) |
| (غير موجود) | updatedAt | — | DateTime | تاريخ آخر تعديل (جديد) |

### 3.3 جدول `position` → `positions`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int(10) unsigned | Int | معرف الوظيفة |
| code | code | varchar | String | كود الوظيفة |
| job | jobId | int | Int | معرف الوظيفة الوظيفية |
| title | title | varchar | String | المسمى الوظيفي |
| description | description | text | String | الوصف |
| proposed_salary | proposedSalary | varchar | String | الراتب المقترح |
| source | source | varchar | String | المصدر |
| supervisor | supervisorId | int | Int | معرف المشرف |
| facility | facilityId | int | Int | معرف المنشأة |
| department | departmentId | int | Int | معرف القسم |
| pos_type | posTypeId | int | Int | معرف نوع الوظيفة |
| proposed_end_date | proposedEndDate | date | DateTime | تاريخ الانتهاء المقترح |
| proposed_hiring_date | proposedHiringDate | date | DateTime | تاريخ التوظيف المقترح |
| status | statusId | int | Int | معرف الحالة |
| posted_date | postedDate | date | DateTime | تاريخ النشر |
| comments | comments | text | String | التعليقات |
| interview_comments | interviewComments | text | String | تعليقات المقابلة |
| (غير موجود) | createdAt | — | DateTime | تاريخ الإنشاء (جديد) |
| (غير موجود) | updatedAt | — | DateTime | تاريخ آخر تعديل (جديد) |

### 3.4 جدول `job` → `jobs`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int | Int | معرف الوظيفة |
| title | title | varchar | String | المسمى الوظيفي |
| code | code | varchar | String | كود الوظيفة |
| description | description | text | String | الوصف |
| salary_grade | salaryGradeId | int | Int | معرف درجة الراتب |
| cadre | cadreId | int | Int | معرف الفئة الوظيفية |
| classification | classificationId | int | Int | معرف التصنيف الوظيفي |
| (غير موجود) | createdAt | — | DateTime | تاريخ الإنشاء (جديد) |
| (غير موجود) | updatedAt | — | DateTime | تاريخ آخر تعديل (جديد) |

### 3.5 جدول `facility` → `facilities`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int | Int | معرف المنشأة |
| name | name | varchar | String | اسم المنشأة |
| facility_type | facilityTypeId | int | Int | معرف نوع المنشأة |
| district | districtId | int | Int | معرف المحافظة |
| county | countyId | int | Int | معرف المديرية |
| country | countryId | int | Int | معرف الدولة |
| region | regionId | int | Int | معرف المنطقة |
| (غير موجود) | createdAt | — | DateTime | تاريخ الإنشاء (جديد) |
| (غير موجود) | updatedAt | — | DateTime | تاريخ آخر تعديل (جديد) |

### 3.6 جدول `salary` → `salaries`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int | Int | معرف الراتب |
| person | personId | int | Int | معرف الشخص |
| start_date | startDate | date | DateTime | تاريخ البداية |
| end_date | endDate | date | DateTime | تاريخ الانتهاء |
| salary | salary | varchar | String | قيمة الراتب |
| notes | notes | text | String | ملاحظات |
| (غير موجود) | createdAt | — | DateTime | تاريخ الإنشاء (جديد) |
| (غير موجود) | updatedAt | — | DateTime | تاريخ آخر تعديل (جديد) |

### 3.7 جدول `training_course` → `training_courses`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int | Int | معرف الدورة |
| name | name | varchar | String | اسم الدورة |
| topic | topic | text | String | الموضوع |
| notes | notes | text | String | ملاحظات |
| training_institution | trainingInstitutionId | int | Int | معرف مؤسسة التدريب |
| training_funder | trainingFunder | varchar | String | الممول |
| continuing_education_course | continuingEducationCourse | varchar | String | دورة التعليم المستمر |
| training_course_status | trainingCourseStatusId | int | Int | معرف حالة الدورة |
| training_course_category | trainingCourseCategoryId | int | Int | معرف تصنيف الدورة |
| competency | competency | varchar | String | الكفاءة |
| (غير موجود) | createdAt | — | DateTime | تاريخ الإنشاء (جديد) |

---

## 4. خريطة النماذج الديناميكية (EAV)

### 4.1 جدول `form` → `forms`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int(10) unsigned | Int | معرف النموذج |
| name | name | varchar(50) | String | اسم النموذج |
| type | type | tinyint(3) unsigned | Int | نوع النموذج |
| (غير موجود) | records | — | Relation | السجلات المرتبطة (جديد) |

### 4.2 جدول `field` → `fields`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int(10) unsigned | Int | معرف الحقل |
| name | name | varchar(50) | String | اسم الحقل |
| type | type | varchar(16) | String | نوع الحقل |
| (غير موجود) | formFields | — | Relation | روابط النموذج (جديد) |

### 4.3 جدول `form_field` → `form_fields`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int(10) unsigned | Int | معرف الربط |
| form | formId | int(10) unsigned | Int | معرف النموذج |
| field | fieldId | int(10) unsigned | Int | معرف الحقل |
| (غير موجود) | entries | — | Relation | entradasociated مع الربط (جديد) |
| (غير موجود) | lastEntries | — | Relation | آخر entradasociated مع الربط (جديد) |

### 4.4 جدول `record` → `records`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| id | id | int(10) unsigned | Int | معرف السجل |
| last_modified | lastModified | datetime | DateTime | تاريخ آخر تعديل |
| form | formId | int(10) unsigned | Int | معرف النموذج |
| parent | parentId | int(10) unsigned | Int | معرف السجل الأب |
| (غير موجود) | entries | — | Relation | entradasociated مع السجل (جديد) |
| (غير موجود) | lastEntry | — | Relation | آخر إدخال مخبأ (جديد) |

### 4.5 جدول `entry` → `entries`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| record | recordId | int(10) unsigned | Int | معرف السجل |
| form_field | formFieldId | int(10) unsigned | Int | معرف ربط النموذج-الحقل |
| date | date | datetime | DateTime | تاريخ الإدخال |
| who | who | int(10) unsigned | Int | معرف المستخدم |
| change_type | changeType | tinyint(3) unsigned | Int | نوع التغيير |
| (غير موجود) | multiple | — | Int | عدد التكرارات (جديد) |
| string_value | stringValue | varchar(255) | String | القيمة النصية القصيرة |
| integer_value | integerValue | int(11) | Int | القيمة العددية |
| text_value | textValue | text | String | القيمة النصية الطويلة |
| date_value | dateValue | datetime | DateTime | القيمة التاريخية |
| blob_value | blobValue | longblob | Bytes | القيمة الثنائية |

### 4.6 جدول `last_entry` → `last_entries`

| العمود القديم | العمود الحديث | النوع القديم | النوع الحديث | ملاحظات |
|-------------|-------------|-------------|------------|---------|
| record | recordId | int(10) unsigned | Int | معرف السجل (جزء من PK) |
| form_field | formFieldId | int(10) unsigned | Int | معرف ربط النموذج-الحقل (جزء من PK) |
| date | date | datetime | DateTime | تاريخ الإدخال |
| who | who | int(10) unsigned | Int | معرف المستخدم |
| change_type | changeType | tinyint(3) unsigned | Int | نوع التغيير |
| (غير موجود) | multiple | — | Int | عدد التكرارات (جديد) |
| string_value | stringValue | varchar(255) | String | القيمة النصية القصيرة |
| integer_value | integerValue | int(11) | Int | القيمة العددية |
| text_value | textValue | text | String | القيمة النصية الطويلة |
| date_value | dateValue | datetime | DateTime | القيمة التاريخية |
| blob_value | blobValue | longblob | Bytes | القيمة الثنائية |

---

## 5. جداول تم إسقاطها (Dropped Tables)

| الجدول القديم | سبب الإسقاط | البديل في النظام الحديث |
|-------------|-------------|------------------------|
| `field_sequence` | غير ضروري في التصميم الجديد | الترتيب يتم عبر طبقة التطبيق |
| `user_log` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً كجدول سجل نشاط |
| `hippo_benefit_type` | تم دمجه في نظام المزايا المبسط | لا يوجد جدول منفصل لأنواع المزايا |
| `hippo_continuing_education` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_continuing_education_course` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_currency` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_degree` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_edu_type` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_marital_status` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_position_select` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_salary_source` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_search` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_training_course_competency_evaluation` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_training_course_evaluation` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_training_course_requestor` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `hippo_training_funder` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً |
| `zebra_facility_list` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً كجدول تقرير |
| `zebra_position_list` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً كجدول تقرير |
| `zebra_staff_chart` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً كجدول تقرير |
| `zebra_staff_list` | غير موجود في النظام الجديد | يمكن إضافته لاحقاً كجدول تقرير |

---

## 6. جداول جديدة في النظام الحديث (New Tables)

| الجدول الحديث | الغرض | لا يوجد مقابل في النظام القديم |
|-------------|-------|-----------------------------|
| `role` | الأدوار (admin, hr_manager, hr_staff, إلخ) | ❌ لا يوجد |
| `permission` | الصلاحيات التفصيلية | ❌ لا يوجد |
| `permission` | الصلاحيات التفصيلية | ❌ لا يوجد |

---

## 7. ملخص التحويل

| البند | القيمة |
|-------|--------|
| إجمالي عدد الجداول القديمة في ihris_manage | 67 جدول |
| عدد الجداول المطابقة完全ًا | 11 جدول |
| عدد الجداول التي أعيدت تسميتها | 30 جدول |
| عدد الجداول التي أعيد تصميمها | 0 جدول |
| عدد الجداول التي تم تقسيمها | 0 جدول |
| عدد الجداول التي تم دمجها | 0 جدول |
| عدد الجداول التي تم إسقاطها | 26 جدول |
| عدد الجداول غير القابلة للتحقق | 0 جدول |
| عدد الجداول الجديدة في النظام الحديث | 2 جدول (role, permission) |

**نسبة التغطية:** (11 + 30) / 67 = 61.2% من الجداول القديمة لها مقابل في النظام الحديث

---

## 8. مصفوفة الأدلة

| العنصر | المصدر | مستوى الثقة |
|--------|---------|-------------|
| قائمة الجداول القديمة | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| قائمة الجداول الحديثة | prisma/schema.prisma في النظام الحديث | مؤكدة |
| أسماء الأعمدة والأنواع | 명령 CREATE TABLE و Prisma schema | مؤكدة |
| العلاقات | تحليل أسماء الأعمدة والقيود | مرجحة |
| الغرض من كل جدول | تحليل الاسم والبنية | مرجحة |

---

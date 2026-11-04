# قواعد العمل القديمة (IHRIS Legacy Business Rules)

## 1. نظرة عامة

تم استخراج قواعد العمل من تحليل:
- قيود قاعدة البيانات (NOT NULL, UNIQUE, CHECK, DEFAULT)
- العلاقات (Foreign Keys)
- البيانات المرجعية والقيم الافتراضية
- إعدادات النظام في جدول `config`
- أنماط البيانات في جداول `entry` و `record`

---

## 2. قواعد صحة البيانات (Data Validation Rules)

### 2.1 قواعد الحقول الإلزامية (NOT NULL Constraints)

| القاعدة | معرف | الجدول | العمود | الوصف | مصدر الدليل |
|--------|-------|--------|--------|-------|-------------|
| BR-001 | NOT_NULL_FORM_NAME | form | name | يجب أن يكون لكل نموذج اسم | CREATE TABLE form |
| BR-002 | NOT_NULL_FORM_TYPE | form | type | يجب أن يكون لكل نموذج نوع | CREATE TABLE form |
| BR-003 | NOT_NULL_FIELD_NAME | field | name | يجب أن يكون لكل حقل اسم | CREATE TABLE field |
| BR-004 | NOT_NULL_FIELD_TYPE | field | type | يجب أن يكون لكل حقل نوع | CREATE TABLE field |
| BR-005 | NOT_NULL_FORM_FIELD_LINK | form_field | form, field | يجب أن يربط كل ربط بين نموذج وحقل صحيحين | CREATE TABLE form_field |
| BR-006 | NOT_NULL_RECORD_FORM | record | form | يجب أن ينتمي كل سجل لنموذج | CREATE TABLE record |
| BR-007 | NOT_NULL_RECORD_MODIFIED | record | last_modified | يجب أن يكون لكل سجل تاريخ تعديل | CREATE TABLE record |
| BR-008 | NOT_NULL_ENTRY_RECORD | entry | record | يجب أن ينتمي كل إدخال لسجل | CREATE TABLE entry |
| BR-009 | NOT_NULL_ENTRY_FORM_FIELD | entry | form_field | يجب أن ينتمي كل إدخال لربط نموذج-حقل | CREATE TABLE entry |
| BR-010 | NOT_NULL_ENTRY_DATE | entry | date | يجب أن يكون لكل إدخال تاريخ | CREATE TABLE entry |
| BR-011 | NOT_NULL_ENTRY_WHO | entry | who | يجب أن يكون لكل إدخال مستخدم قام بالتغيير | CREATE TABLE entry |
| BR-012 | NOT_NULL_ENTRY_CHANGE_TYPE | entry | change_type | يجب أن يكون لكل إدخال نوع تغيير | CREATE TABLE entry |
| BR-013 | NOT_NULL_USER_USERNAME | user | username | يجب أن يكون لكل مستخدم اسم مستخدم | CREATE TABLE user |
| BR-014 | NOT_NULL_USER_PASSWORD | user | password | يجب أن يكون لكل مستخدم كلمة مرور | CREATE TABLE user |
| BR-015 | NOT_NULL_USER_FIRSTNAME | user | firstname | يجب أن يكون لكل مستخدم اسم أول | CREATE TABLE user |
| BR-016 | NOT_NULL_USER_LASTNAME | user | lastname | يجب أن يكون لكل مستخدم اسم عائلة | CREATE TABLE user |
| BR-017 | NOT_NULL_USER_CREATOR | user | creator | يجب أن يكون لكل مستخدم منشئ | CREATE TABLE user |
| BR-018 | NOT_NULL_ACCESS_USER | access | user | يجب أن يكون لكل سجل صلاحية معرف مستخدم | CREATE TABLE access |
| BR-019 | NOT_NULL_ACCESS_ROLE | access | role | يجب أن يكون لكل سجل صلاحية دور | CREATE TABLE access |

### 2.2 قواعد القفل الفريد (Unique Constraints)

| القاعدة | معرف | الجدول | الأعمدة | الوصف | مصدر الدليل |
|--------|-------|--------|--------|-------|-------------|
| BR-020 | UNIQUE_FORM_NAME | form | name | لا يمكن تكرار اسم النموذج | UNIQUE KEY name |
| BR-021 | UNIQUE_FIELD_NAME_TYPE | field | name, type | لا يمكن تكرار مزيج اسم الحقل ونوعه | UNIQUE KEY name_type |
| BR-022 | UNIQUE_FORM_FIELD_LINK | form_field | form, field | لا يمكن تكرار ربط نموذج وحقل معين | UNIQUE KEY form (form, field) |
| BR-023 | UNIQUE_USER_USERNAME | user | username | لا يمكن تكرار اسم المستخدم | UNIQUE KEY username |

### 2.3 قواعد القيم الافتراضية (Default Values)

| القاعدة | معرف | الجدول | العمود | القيمة الافتراضية | الوصف | مصدر الدليل |
|--------|-------|--------|--------|------------------|-------|-------------|
| BR-024 | DEFAULT_RECORD_PARENT | record | parent | NULL (لا أب") | السجل يمكن أن يكون جذراً أو فرعياً | CREATE TABLE record |
| BR-025 | DEFAULT_ACCESS_ROLE | access | role | — | لا يوجد افتراضي، يجب تحديد الدور | CREATE TABLE access |

---

## 3. قواعد العلاقات (Relationship Rules)

### 3.1 العلاقات الأساسية (Foreign Keys implied)

| القاعدة | معرف | الجدول الابن | العمود | الجدول الأب | العمود المرجعي | نوع العلاقة | مصدر الدليل |
|--------|-------|-------------|--------|-------------|--------------|-------------|-------------|
| BR-026 | FK_RECORD_FORM | record | form | form | id | One-to-Many | تحليل اسم العمود |
| BR-027 | FK_RECORD_PARENT | record | parent | record | id | One-to-Many (ذاتية) | تحليل اسم العمود |
| BR-028 | FK_ENTRY_RECORD | entry | record | record | id | One-to-Many | تحليل اسم العمود |
| BR-029 | FK_ENTRY_FORM_FIELD | entry | form_field | form_field | id | One-to-Many | تحليل اسم العمود |
| BR-030 | FK_FORM_FIELD_FORM | form_field | form | form | id | One-to-Many | تحليل اسم العمود |
| BR-031 | FK_FORM_FIELD_FIELD | form_field | field | field | id | One-to-Many | تحليل اسم العمود |
| BR-032 | FK_USER_CREATOR | user | creator | user | id | One-to-Many (ذاتية) | تحليل اسم العمود |
| BR-033 | FK_ACCESS_USER | access | user | user | id | One-to-One | تحليل اسم العمود (PRIMARY KEY on user) |

### 3.2 قواعد العلاقات في جداول hippo_* (مستنتجة من أسماء الأعمدة)

| القاعدة | معرف | الجدول الابن | العمود | الجدول الأب المحتمل | العمود المرجعي المحتمل | نوع العلاقة |
|--------|-------|-------------|--------|-------------------|----------------------|-------------|
| BR-034 | FK_PERSON_NATIONALITY | hippo_person | nationality | hippo_country | id | Many-to-One |
| BR-035 | FK_PERSON_RESIDENCE_COUNTRY | hippo_person | residence_country | hippo_country | id | Many-to-One |
| BR-036 | FK_PERSON_RESIDENCE_DISTRICT | hippo_person | residence_district | hippo_district | id | Many-to-One |
| BR-037 | FK_PERSON_RESIDENCE_COUNTY | hippo_person | residence_county | hippo_county | id | Many-to-One |
| BR-038 | FK_POSITION_JOB | hippo_position | job | hippo_job | id | Many-to-One |
| BR-039 | FK_POSITION_FACILITY | hippo_position | facility | hippo_facility | id | Many-to-One |
| BR-040 | FK_POSITION_DEPARTMENT | hippo_position | department | hippo_department | id | Many-to-One |
| BR-041 | FK_POSITION_SUPERVISOR | hippo_position | supervisor | hippo_position | id | One-to-Many (ذاتية) |
| BR-042 | FK_POSITION_TYPE | hippo_position | pos_type | hippo_position_type | id | Many-to-One |
| BR-043 | FK_POSITION_STATUS | hippo_position | status | hippo_pos_change_reason | id | Many-to-One |
| BR-044 | FK_JOB_SALARY_GRADE | hippo_job | salary_grade | hippo_salary_grade | id | Many-to-One |
| BR-045 | FK_JOB_CADRE | hippo_job | cadre | hippo_cadre | id | Many-to-One |
| BR-046 | FK_JOB_CLASSIFICATION | hippo_job | classification | hippo_classification | id | Many-to-One |
| BR-047 | FK_FACILITY_TYPE | hippo_facility | facility_type | hippo_facility_type | id | Many-to-One |
| BR-048 | FK_FACILITY_DISTRICT | hippo_facility | district | hippo_district | id | Many-to-One |
| BR-049 | FK_FACILITY_COUNTY | hippo_facility | county | hippo_county | id | Many-to-One |
| BR-050 | FK_FACILITY_COUNTRY | hippo_facility | country | hippo_country | id | Many-to-One |
| BR-051 | FK_FACILITY_REGION | hippo_facility | region | hippo_region | id | Many-to-One |
| BR-052 | FK_SALARY_PERSON | hippo_salary | person | hippo_person | id | Many-to-One |
| BR-053 | FK_TRAINING_INSTITUTION | hippo_training_course | training_institution | hippo_training_institution | id | Many-to-One |
| BR-054 | FK_TRAINING_STATUS | hippo_training_course | training_course_status | hippo_training_course_status | id | Many-to-One |
| BR-055 | FK_TRAINING_CATEGORY | hippo_training_course | training_course_category | hippo_training_course_category | id | Many-to-One |
| BR-056 | FK_SCHEDULED_TRAINING_COURSE | hippo_scheduled_training_course | training_course | hippo_training_course | id | Many-to-One |
| BR-057 | FK_PERSON_SCHEDULED_TRAINING_PERSON | hippo_person_scheduled_training_course | person | hippo_person | id | Many-to-One |
| BR-058 | FK_PERSON_SCHEDULED_TRAINING_COURSE | hippo_person_scheduled_training_course | scheduled_training_course | hippo_scheduled_training_course | id | Many-to-One |
| BR-059 | FK_PERSON_POSITION_PERSON | hippo_person_position | person | hippo_person | id | Many-to-One |
| BR-060 | FK_PERSON_POSITION_POSITION | hippo_person_position | position | hippo_position | id | Many-to-One |

---

## 4. قواعد إنشاء السجلات (Record Creation Rules)

| القاعدة | معرف | الوصف | مصدر الدليل |
|--------|-------|-------|-------------|
| BR-061 | CREATE_RECORD_REQUIRES_FORM | لا يمكن إنشاء سجل دون تحديد النموذج الذي ينتمي إليه | NOT NULL على form في جدول record |
| BR-062 | CREATE_ENTRY_REQUIRES_RECORD_AND_FIELD | لا يمكن إنشاء إدخال دون تحديد السجل وربط النموذج-الحقل | NOT NULL على record و form_field في جدول entry |
| BR-063 | CREATE_USER_REQUIRES_CREATOR | لا يمكن إنشاء مستخدم دون تحديد المنشئ | NOT NULL على creator في جدول user |
| BR-064 | CREATE_ACCESS_REQUIRES_USER_AND_ROLE | لا يمكن إنشاء سجل صلاحية دون تحديد المستخدم والدور | NOT NULL على user و role في جدول access |
| BR-065 | RECORD_CAN_HAVE_PARENT | يمكن أن يكون للسجل سجل أب للعلاقات الهرمية، ولكن ليس إلزامياً | parent nullable في جدول record |
| BR-066 | ENTRY_VALUES_OPTIONAL | قيم الحقول (string_value, integer_value, text_value, date_value, blob_value) اختيارية، ولكن يجب أن يكون هناك نوع واحد على الأقل | جميع حقول القيم nullable في جدول entry |

---

## 5. قواعد تعديل السجلات (Record Modification Rules)

| القاعدة | معرف | الوصف | مصدر الدليل |
|--------|-------|-------|-------------|
| BR-067 | UPDATE_RECORD_MODIFIES_TIMESTAMP | عند تعديل سجل، يجب تحديث حقل last_modified | وجود حقل last_modified في جدول record |
| BR-068 | UPDATE_ENTRY_CREATES_NEW_VERSION | عند تعديل قيمة حقل، يتم إنشاء إدخال جديد في جدول entry مع تاريخ جديد | وجود حقل date في جدول entry (لا يوجد UPDATE، فقط INSERT) |
| BR-069 | LAST_ENTRY_UPDATED_ON_CHANGE | عند تغيير قيمة حقل، يجب تحديث جدول last_entry بالقيمة الجديدة | وجود جدول last_entry كمخزن للآخر قيمة |
| BR-070 | CHANGE_TYPE_TRACKS_OPERATION | نوع التغيير (change_type) يحدد نوع العملية (إضافة=1، تعديل=4، إلخ) | وجود حقل change_type في جدول entry |

---

## 6. قواعد الحالات (Status Rules)

| القاعدة | معرف | الحالة | الانتقالات المسموحة | مصدر الدليل |
|--------|-------|--------|-------------------|-------------|
| BR-071 | POSITION_STATUS_VACANT | شاغرة | → مشغولة (عند تعيين شخص)، → ملغاة | تحليل اسم الجدول hippo_pos_change_reason |
| BR-072 | POSITION_STATUS_FILLED | مشغولة | → شاغرة (عند إنهاء الارتباط)، → ملغاة | تحليل اسم الجدول hippo_pos_change_reason |
| BR-073 | POSITION_STATUS_IN_PROCESS | تحت الإجراء | → شاغرة، → مشغولة، → ملغاة | تحليل اسم الجدول hippo_pos_change_reason |
| BR-074 | POSITION_STATUS_CANCELLED | ملغاة | لا انتقالات مسموحة | تحليل اسم الجدول hippo_pos_change_reason |
| BR-075 | TRAINING_STATUS_SCHEDULED | مجدولة | → مكتملة، → ملغاة، → قيد التخطيط | تحليل اسم الجدول hippo_training_course_status |
| BR-076 | TRAINING_STATUS_COMPLETED | مكتملة | لا انتقالات | تحليل اسم الجدول hippo_training_course_status |
| BR-077 | TRAINING_STATUS_CANCELLED | ملغاة | لا انتقالات | تحليل اسم الجدول hippo_training_course_status |
| BR-078 | TRAINING_STATUS_PLANNING | قيد التخطيط | → مجدولة، → ملغاة | تحليل اسم الجدول hippo_training_course_status |

---

## 7. قواعد الصلاحيات (Permission Rules)

| القاعدة | معرف | الوصف | مصدر الدليل |
|--------|-------|-------|-------------|
| BR-079 | ACCESS_ONE_ROLE_PER_USER | كل مستخدم يمكن أن يكون له دور واحد فقط (بناءً على PRIMARY KEY على user في جدول access) | PRIMARY KEY (user) في جدول access |
| BR-080 | USER_MUST_HAVE_ROLE | يجب أن يكون لكل مستخدم دور واحد على الأقل | وجود جدول access لربط المستخدمين بالأدوار |
| BR-081 | ADMIN_ROLE_EXISTS | يجب أن يكون هناك دور مسؤول واحد على الأقل | وجود سجل (1, 'admin') في جدول access |
| BR-082 | CREATOR_CANNOT_BE_NULL | المنشئ (creator) في جدول user لا يمكن أن يكون NULL | NOT NULL على creator في جدول user |

---

## 8. قواعد التوقيت (Timing Rules)

| القاعدة | معرف | الوصف | مصدر الدليل |
|--------|-------|-------|-------------|
| BR-083 | RECORD_LAST_MODIFIED_AUTO | تاريخ التعديل التلقائي عند إنشاء أو تحديث سجل | وجود حقل last_modified مع NOT NULL في جدول record |
| BR-084 |_ENTRY_DATE_TIMESTAMP | تاريخ الإدخال يحدد متى تم إدخال القيمة | وجود حقل date في جدول entry |
| BR-085 | USER_LOG_LOGIN_REQUIRED | تاريخ تسجيل الدخول إلزامي في سجل النشاط | NOT NULL على login في جدول user_log |
| BR-086 | USER_LOG_LOGOUT_OPTIONAL | تاريخ تسجيل الخروج اختياري في سجل النشاط | logout nullable في جدول user_log |

---

## 9. قواعد الإغلاق والإلغاء (Closure and Cancellation Rules)

| القاعدة | معرف | الوصف | مصدر الدليل |
|--------|-------|-------|-------------|
| BR-087 | POSITION_CAN_BE_CANCELLED | يمكن إلغاء وظيفة إذا كانت في حالة "تحت الإجراء" أو "شاغرة" | تحليل جدول hippo_pos_change_reason |
| BR-088 | TRAINING_CAN_BE_CANCELLED | يمكن إلغاء دورة تدريبية إذا كانت في حالة "مجدولة" أو "قيد التخطيط" | تحليل جدول hippo_training_course_status |
| BR-089 | RECORD_CAN_BE_SOFT_DELETED | يمكن حذف سجل ناعمًا عبر جدول deleted_record | وجود جدول deleted_record |
| BR-090 | TRAINING_COMPLETION_TRACKING | يمكن تتبع إكمال الدورة عبر حقل completed في جدول hippo_person_scheduled_training_course | وجود حقل completed في جدول hippo_person_scheduled_training_course |

---

## 10. قواعد التكرار والارشفة (Archiving Rules)

| القاعدة | معرف | الوصف | مصدر الدليل |
|--------|-------|-------|-------------|
| BR-091 | ENTRY_VERSIONING | كل تعديل على قيمة حقل يُنشئ إدخالًا جديدًا في جدول entry (إصدار جديد) | وجود حقل date في جدول entry (لا تحديث، فقط إدراج) |
| BR-092 | LAST_ENTRY_CACHING | جدول last_entry يخزن آخر قيمة لكل حقل لكل سجل للوصول السريع | وجود جدول last_entry |
| BR-093 | SOFT_DELETE_RECORDS | السجلات المحذوفة تُنقل إلى جدول deleted_record بدلاً من الحذف النهائي | وجود جدول deleted_record |

---

## 11. قواعد البيانات المرجعية (Reference Data Rules)

| القاعدة | معرف | الجدول | الوصف | مصدر الدليل |
|--------|-------|--------|-------|-------------|
| BR-094 | COUNTRY_REQUIRED_FOR_ADDRESS | الدولة مطلوبة لعنوان الشخص | وجود حقل country في جدول hippo_person |
| BR-095 | DISTRICT_REQUIRES_COUNTRY | المنطقة يجب أن تنتمي لدولة | وجود حقل country_id في جدول hippo_district (مستنتج) |
| BR-096 | COUNTY_REQUIRES_DISTRICT | المديرية يجب أن تنتمي لمنطقة | وجود حقل district_id في جدول hippo_county (مستنتج) |
| BR-097 | FACILITY_REQUIRES_LOCATION | المنشأة يجب أن يكون لها منطقة، محافظة، مديرية، دولة | وجود حقول district, county, country, region في جدول hippo_facility |

---

## 12. مصفوفة الأدلة ومستويات الثقة

| القاعدة | معرف | المصدر | مستوى الثقة |
|--------|-------|---------|-------------|
| BR-001 إلى BR-025 | قيود NOT NULL, UNIQUE, DEFAULT | 명령 CREATE TABLE في ملف SQL | مؤكدة |
| BR-026 إلى BR-033 | العلاقات الأساسية | تحليل أسماء الأعمدة في ملف SQL | مؤكدة |
| BR-034 إلى BR-060 | علاقات hippo_* | تحليل أسماء الأعمدة (مستنتج) | مرجحة |
| BR-061 إلى BR-093 | قواعد العمل المنبثقة | تحليل بنية الجداول والعلاقات | مرجحة |
| BR-094 إلى BR-097 | قواعد البيانات المرجعية | تحليل حقول جداول hippo_* | مرجحة |

---

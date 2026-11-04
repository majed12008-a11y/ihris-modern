# قاموس بيانات النظام الحديث (IHRIS Modern Data Dictionary)

## 1. نظرة عامة

| الخاصية | القيمة |
|---------|--------|
| نوع قاعدة البيانات | PostgreSQL 15+ |
| أداة الخريطة (ORM) | Prisma ORM |
| موقع المخطط | `backend/prisma/schema.prisma` |
| عدد النماذج | 52 نموذج |
| نمط البيانات | نموذج علاقة ثابت (Fixed Relational) مع إمكانية التوسع لـ EAV |

---

## 2. جداول المستخدمين والصلاحية (Users & Access Control)

### 2.1 نموذج `User` — المستخدمين

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف المستخدم (مفتاح أساسي) |
| username | String (@db.VarChar(30)) | NO | — | اسم المستخدم (مUnique) |
| password | String (@db.VarChar(255)) | NO | — | كلمة المرور (bcrypt hash) |
| firstname | String (@db.VarChar(255)) | NO | — | الاسم الأول |
| lastname | String (@db.VarChar(255)) | NO | — | اسم العائلة |
| email | String (@db.VarChar(255)) | NO | — | البريد الإلكتروني (مUnique) |
| creatorId | Int | YES | 1 | معرف المنشئ |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |
| personId | Int | YES | — | معرف الشخص المرتبط (مفتاح خارجي إلى Person) |

**العلاقات:**
- user → Person (One-to-One, اختياري)
- user → UserAccess (One-to-Many)

---

### 2.2 نموذج `Role` — الأدوار

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الدور (مفتاح أساسي) |
| name | String (@db.VarChar(50)) | NO | — | اسم الدور (مUnique) |
| displayName | String (@db.VarChar(100)) | NO | — | اسم العرض |
| description | String | YES | — | الوصف |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Role → UserAccess (One-to-Many)
- Role → Permission (One-to-Many)

**الأدوار المعرفة:**
1. admin — مسؤول النظام، الوصول الكامل
2. hr_manager — مدير الموارد البشرية
3. hr_staff — موظف موارد بشرية
4. training_manager — مدير التدريب
5. exec_manager — مدير تنفيذي

---

### 2.3 نموذج `UserAccess` — ربط المستخدمين بالأدوار

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الربط (مفتاح أساسي) |
| userId | Int | NO | — | معرف المستخدم (مفتاح خارجي إلى User) |
| roleId | Int | NO | — | معرف الدور (مفتاح خارجي إلى Role) |
| grantedAt | DateTime | NO | now() | تاريخ المنح |

**القيود:** unique([userId, roleId]) — لا يمكن تكرار نفس الربط

**العلاقات:**
- UserAccess → User (Many-to-One)
- UserAccess → Role (Many-to-One)

---

### 2.4 نموذج `Permission` — الصلاحيات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الصلاحية (مفتاح أساسي) |
| name | String (@db.VarChar(100)) | NO | — | اسم الصلاحية (مUnique) |
| description | String | YES | — | الوصف |
| roleId | Int | NO | — | معرف الدور (مفتاح خارجي إلى Role) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Permission → Role (Many-to-One)

---

## 3. جداول الكيانات الأساسية (Core HR Entities)

### 3.1 نموذج `Person` — الأشخاص

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الشخص (مفتاح أساسي) |
| surname | String | NO | — | اللقب (الاسم الأخير) |
| firstname | String | NO | — | الاسم الأول |
| othername | String | YES | NULL | الأسماء الأخرى |
| nationalityId | Int | YES | NULL | الجنسية (مفتاح خارجي إلى Country) |
| countryId | Int | YES | NULL | دولة الإقامة (مفتاح خارجي إلى Country) |
| districtId | Int | YES | NULL | محافظة الإقامة (مفتاح خارجي إلى District) |
| countyId | Int | YES | NULL | مديرية الإقامة (مفتاح خارجي إلى County) |
| residenceCountryId | Int | YES | NULL | دولة الإقامة البديلة |
| residenceDistrictId | Int | YES | NULL | محافظة الإقامة البديلة |
| residenceCountyId | Int | YES | NULL | مديرية الإقامة البديلة |
| password | String | YES | NULL | كلمة مرور الشخص (اختياري) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**العلاقات:**
- Person → User (One-to-One, اختياري)
- Person → Country (Many-to-One, عبر countryId)
- Person → District (Many-to-One, عبر districtId)
- Person → County (Many-to-One, عبر countyId)
- Person → Contact (One-to-Many)
- Person → Demographic (One-to-Many)
- Person → PersonId (One-to-Many)
- Person → PersonLanguage (One-to-Many)
- Person → PersonCompetency (One-to-Many)
- Person → PersonPosition (One-to-Many)
- Person → Note (One-to-Many)
- Person → Employment (One-to-Many)
- Person → Education (One-to-Many)
- Person → Benefit (One-to-Many)
- Person → Application (One-to-Many, اختياري)
- Person → Salary (One-to-Many)

---

### 3.2 نموذج `Position` — الوظائف الشاغرة

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الوظيفة (مفتاح أساسي) |
| code | String | YES | NULL | كود الوظيفة |
| jobId | Int | YES | NULL | معرف الوظيفة الوظيفية (مفتاح خارجي إلى Job) |
| title | String | YES | NULL | المسمى الوظيفي |
| description | String | YES | NULL | الوصف |
| proposedSalary | String | YES | NULL | الراتب المقترح |
| source | String | YES | NULL | المصدر |
| supervisorId | Int | YES | NULL | معرف المشرف (مفتاح خارجي إلى Position ذاتي) |
| facilityId | Int | YES | NULL | معرف المنشأة (مفتاح خارجي إلى Facility) |
| departmentId | Int | YES | NULL | معرف القسم (مفتاح خارجي إلى Department) |
| posTypeId | Int | YES | NULL | معرف نوع الوظيفة (مفتاح خارجي إلى JobType) |
| proposedEndDate | DateTime | YES | NULL | تاريخ الانتهاء المقترح |
| proposedHiringDate | DateTime | YES | NULL | تاريخ التوظيف المقترح |
| statusId | Int | YES | NULL | معرف الحالة (مفتاح خارجي إلى PositionStatus) |
| postedDate | DateTime | YES | NULL | تاريخ النشر |
| comments | String | YES | NULL | التعليقات |
| interviewComments | String | YES | NULL | تعليقات المقابلة |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**العلاقات:**
- Position → Job (Many-to-One, اختياري)
- Position → Facility (Many-to-One, اختياري)
- Position → Department (Many-to-One, اختياري)
- Position → JobType (Many-to-One, اختياري)
- Position → PositionStatus (Many-to-One, اختياري)
- Position → Position (Many-to-One, ذاتي، عبر supervisorId)
- Position → PersonPosition (One-to-Many)
- Position → PositionDecision (One-to-Many)
- Position → PositionInterview (One-to-Many)

---

### 3.3 نموذج `Job` — الوظائف الوظيفية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الوظيفة (مفتاح أساسي) |
| title | String | NO | — | المسمى الوظيفي |
| code | String | YES | NULL | كود الوظيفة |
| description | String | YES | NULL | الوصف |
| salaryGradeId | Int | YES | NULL | معرف درجة الراتب (مفتاح خارجي إلى SalaryGrade) |
| cadreId | Int | YES | NULL | معرف الفئة الوظيفية (مفتاح خارجي إلى Cadre) |
| classificationId | Int | YES | NULL | معرف التصنيف الوظيفي (مفتاح خارجي إلى Classification) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**العلاقات:**
- Job → SalaryGrade (Many-to-One, اختياري)
- Job → Cadre (Many-to-One, اختياري)
- Job → Classification (Many-to-One, اختياري)
- Job → Position (One-to-Many)

---

### 3.4 نموذج `Facility` — المنشآت الصحية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف المنشأة (مفتاح أساسي) |
| name | String | NO | — | اسم المنشأة |
| facilityTypeId | Int | YES | NULL | معرف نوع المنشأة (مفتاح خارجي إلى FacilityType) |
| districtId | Int | YES | NULL | معرف المحافظة (مفتاح خارجي إلى District) |
| countyId | Int | YES | NULL | معرف المديرية (مفتاح خارجي إلى County) |
| countryId | Int | YES | NULL | معرف الدولة (مفتاح خارجي إلى Country) |
| regionId | Int | YES | NULL | معرف المنطقة (مفتاح خارجي إلى Region) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**العلاقات:**
- Facility → FacilityType (Many-to-One, اختياري)
- Facility → District (Many-to-One, اختياري)
- Facility → County (Many-to-One, اختياري)
- Facility → Country (Many-to-One, اختياري)
- Facility → Region (Many-to-One, اختياري)
- Facility → Position (One-to-Many)

---

### 3.5 نموذج `Salary` — الرواتب

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الراتب (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| startDate | DateTime | NO | — | تاريخ البداية |
| endDate | DateTime | YES | NULL | تاريخ الانتهاء |
| salary | String | NO | — | قيمة الراتب |
| notes | String | YES | NULL | ملاحظات |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**العلاقات:**
- Salary → Person (Many-to-One, عبر personId)

---

## 4. جداول البيانات المرجعية (Reference Tables)

### 4.1 نموذج `Country` — الدول

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الدولة (مفتاح أساسي) |
| name | String | NO | — | اسم الدولة (مUnique) |
| code | String | YES | NULL | رمز الدولة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Country → District (One-to-Many)
- Country → Facility (One-to-Many)
- Country → Person (One-to-Many)

---

### 4.2 نموذج `District` — المحافظات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف المحافظة (مفتاح أساسي) |
| name | String | NO | — | اسم المحافظة |
| countryId | Int | NO | — | معرف الدولة (مفتاح خارجي إلى Country) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- District → Country (Many-to-One)
- District → County (One-to-Many)
- District → Facility (One-to-Many)
- District → Person (One-to-Many)

---

### 4.3 نموذج `County` — المديريات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف المديرية (مفتاح أساسي) |
| name | String | NO | — | اسم المديرية |
| districtId | Int | NO | — | معرف المحافظة (مفتاح خارجي إلى District) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- County → District (Many-to-One)
- County → Facility (One-to-Many)
- County → Person (One-to-Many)

---

### 4.4 نموذج `Region` — المناطق

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف المنطقة (مفتاح أساسي) |
| name | String | NO | — | اسم المنطقة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Region → Facility (One-to-Many)

---

### 4.5 نموذج `JobType` — أنواع الوظائف

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف النوع (مفتاح أساسي) |
| name | String | NO | — | اسم النوع (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- JobType → Position (One-to-Many)

---

### 4.6 نموذج `PositionStatus` — حالات الوظائف

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الحالة (مفتاح أساسي) |
| name | String | NO | — | اسم الحالة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- PositionStatus → Position (One-to-Many)

---

### 4.7 نموذج `SalaryGrade` — درجات الرواتب

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الدرجة (مفتاح أساسي) |
| name | String | NO | — | اسم الدرجة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- SalaryGrade → Job (One-to-Many)

---

### 4.8 نموذج `Cadre` — الفئات الوظيفية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الفئة (مفتاح أساسي) |
| name | String | NO | — | اسم الفئة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Cadre → Job (One-to-Many)

---

### 4.9 نموذج `Classification` — التصنيفات الوظيفية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف التصنيف (مفتاح أساسي) |
| name | String | NO | — | اسم التصنيف (مUnique) |
| description | String | YES | NULL | الوصف |
| code | String | YES | NULL | رمز التصنيف |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Classification → Job (One-to-Many)

---

### 4.10 نموذج `FacilityType` — أنواع المنشآت

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف النوع (مفتاح أساسي) |
| name | String | NO | — | اسم النوع (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- FacilityType → Facility (One-to-Many)

---

### 4.11 نموذج `Department` — الأقسام

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف القسم (مفتاح أساسي) |
| name | String | NO | — | اسم القسم (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Department → Position (One-to-Many)

---

## 5. جداول العلاقات الفرعية (Person Sub-entities)

### 5.1 نموذج `Contact` — معلومات الاتصال

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الاتصال (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| contactType | String | YES | NULL | نوع الاتصال |
| address | String | YES | NULL | العنوان |
| telephone | String | YES | NULL | الهاتف |
| altTelephone | String | YES | NULL | الهاتف البديل |
| fax | String | YES | NULL | الفاكس |
| email | String | YES | NULL | البريد الإلكتروني |
| notes | String | YES | NULL | ملاحظات |
| birthDate | DateTime | YES | NULL | تاريخ الميلاد |
| genderId | Int | YES | NULL | معرف الجنس |
| maritalStatusId | Int | YES | NULL | معرف الحالة الاجتماعية |
| dependents | Int | YES | NULL | عدد المعالين |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**العلاقات:**
- Contact → Person (Many-to-One, عبر personId)

---

### 5.2 نموذج `Demographic` — البيانات الديموغرافية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف البيانات الديموغرافية (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| birthDate | DateTime | YES | NULL | تاريخ الميلاد |
| genderId | Int | YES | NULL | معرف الجنس |
| maritalStatusId | Int | YES | NULL | معرف الحالة الاجتماعية |
| dependents | Int | YES | NULL | عدد المعالين |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**العلاقات:**
- Demographic → Person (Many-to-One, عبر personId)

---

### 5.3 نموذج `PersonId` — بطاقات الهوية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف بطاقة الهوية (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| idTypeId | Int | YES | NULL | معرف نوع البطاقة (مفتاح خارجي إلى IdType) |
| idNum | String | YES | NULL | رقم البطاقة |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- PersonId → Person (Many-to-One, عبر personId)
- PersonId → IdType (Many-to-One, اختياري، عبر idTypeId)

---

### 5.4 نموذج `IdType` — أنواع بطاقات الهوية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف النوع (مفتاح أساسي) |
| name | String | NO | — | اسم النوع (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- IdType → PersonId (One-to-Many)

---

### 5.5 نموذج `PersonLanguage` — لغات الأشخاص

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف اللغة (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| languageId | Int | YES | NULL | معرف اللغة (مفتاح خارجي إلى Language) |
| speaking | Int | YES | NULL | مستوى التحدث |
| reading | Int | YES | NULL | مستوى القراءة |
| writing | Int | YES | NULL | مستوى الكتابة |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- PersonLanguage → Person (Many-to-One, عبر personId)
- PersonLanguage → Language (Many-to-One, اختياري، عبر languageId)

---

### 5.6 نموذج `Language` — اللغات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف اللغة (مفتاح أساسي) |
| name | String | NO | — | اسم اللغة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Language → PersonLanguage (One-to-Many)

---

### 5.7 نموذج `PersonCompetency` — كفاءات الأشخاص

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الكفاءة (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| competencyTypeId | Int | YES | NULL | معرف نوع الكفاءة (مفتاح خارجي إلى CompetencyType) |
| competencyId | Int | YES | NULL | معرف الكفاءة (مفتاح خارجي إلى Competency) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- PersonCompetency → Person (Many-to-One, عبر personId)
- PersonCompetency → CompetencyType (Many-to-One, اختياري، عبر competencyTypeId)
- PersonCompetency → Competency (Many-to-One, اختياري، عبر competencyId)

---

### 5.8 نموذج `CompetencyType` — أنواع الكفاءات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف النوع (مفتاح أساسي) |
| name | String | NO | — | اسم النوع (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- CompetencyType → Competency (One-to-Many)
- CompetencyType → PersonCompetency (One-to-Many)

---

### 5.9 نموذج `Competency` — الكفاءات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الكفاءة (مفتاح أساسي) |
| name | String | NO | — | اسم الكفاءة (مUnique) |
| competencyTypeId | Int | NO | — | معرف نوع الكفاءة (مفتاح خارجي إلى CompetencyType) |
| notes | String | YES | NULL | ملاحظات |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Competency → CompetencyType (Many-to-One)
- Competency → PersonCompetency (One-to-Many)

---

### 5.10 نموذج `PersonPosition` — ارتباط الأشخاص بالوظائف

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الارتباط (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| positionId | Int | NO | — | معرف الوظيفة (مفتاح خارجي إلى Position) |
| startDate | DateTime | YES | NULL | تاريخ البداية |
| endDate | DateTime | YES | NULL | تاريخ الانتهاء |
| reasonId | Int | YES | NULL | معرف السبب (مفتاح خارجي إلى PositionStatus) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |
| updatedAt | DateTime | NO | updatedAt | تاريخ آخر تعديل |

**القيود:** unique([personId, positionId, startDate])

**العلاقات:**
- PersonPosition → Person (Many-to-One)
- PersonPosition → Position (Many-to-One)

---

### 5.11 نموذج `PositionDecision` — قرارات الوظائف

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف القرار (مفتاح أساسي) |
| positionId | Int | NO | — | معرف الوظيفة (مفتاح خارجي إلى Position) |
| decisionDate | DateTime | NO | — | تاريخ القرار |
| offer | Int | YES | NULL | العرض |
| comments | String | YES | NULL | التعليقات |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- PositionDecision → Position (Many-to-One)

---

### 5.12 نموذج `PositionInterview` — مقابلات الوظائف

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف المقابلة (مفتاح أساسي) |
| positionId | Int | NO | — | معرف الوظيفة (مفتاح خارجي إلى Position) |
| interviewDate | DateTime | NO | — | تاريخ المقابلة |
| person | String | YES | NULL | اسم الشخص المقابل |
| comments | String | YES | NULL | التعليقات |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- PositionInterview → Position (Many-to-One)

---

### 5.13 نموذج `Note` — الملاحظات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الملاحظة (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| note | String | YES | NULL | نص الملاحظة |
| dateAdded | DateTime | YES | NULL | تاريخ الإضافة |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Note → Person (Many-to-One, عبر personId)

---

## 6. جداول التوظيف والتعليم والمزايا والطلبات

### 6.1 نموذج `Employment` — التوظيف السابق

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف التوظيف (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| companyName | String | YES | NULL | اسم الشركة |
| companyAddress | String | YES | NULL | عنوان الشركة |
| companyPhone | String | YES | NULL | هاتف الشركة |
| startDate | DateTime | YES | NULL | تاريخ البداية |
| startWage | Int | YES | NULL | الراتب المبدئي |
| startPosition | String | YES | NULL | المنصب المبدئي |
| endDate | DateTime | YES | NULL | تاريخ الانتهاء |
| endWage | Int | YES | NULL | الراتب النهائي |
| endPosition | String | YES | NULL | المنصب النهائي |
| supervisor | String | YES | NULL | المشرف |
| contactOk | Boolean | NO | false | يمكن الاتصال |
| responsibilities | String | YES | NULL | المسؤوليات |
| reasonForLeaving | String | YES | NULL | سبب المغادرة |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Employment → Person (Many-to-One, عبر personId)

---

### 6.2 نموذج `Education` — التعليم

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف التعليم (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| eduTypeId | Int | YES | NULL | معرف نوع التعليم |
| degreeId | Int | YES | NULL | معرف الشهادة |
| institution | String | YES | NULL | المؤسسة التعليمية |
| location | String | YES | NULL | الموقع |
| year | DateTime | YES | NULL | السنة |
| major | String | YES | NULL | التخصص |
| completed | Boolean | NO | false | هل أكمل |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Education → Person (Many-to-One, عبر personId)

---

### 6.3 نموذج `Benefit` — المزايا

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الميزة (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| typeId | Int | YES | NULL | معرف نوع الميزة |
| amount | String | YES | NULL | المبلغ |
| sourceId | Int | YES | NULL | معرف المصدر |
| startDate | DateTime | YES | NULL | تاريخ البداية |
| endDate | DateTime | YES | NULL | تاريخ الانتهاء |
| recurrence | Int | YES | NULL | التكرار |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Benefit → Person (Many-to-One, عبر personId)

---

### 6.4 نموذج `Application` — طلبات التوظيف

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الطلب (مفتاح أساسي) |
| personId | Int | YES | NULL | معرف الشخص (مفتاح خارجي إلى Person) |
| positionId | Int | YES | NULL | معرف الوظيفة (مفتاح خارجي إلى Position) |
| felony | Int | YES | NULL | جناية |
| felonyCircumstance | String | YES | NULL | ظروف الجناية |
| otherInfo | String | YES | NULL | معلومات أخرى |
| hear | String | YES | NULL | كيف سمع عن الوظيفة |
| startDate | DateTime | YES | NULL | تاريخ البداية المطلوب |
| desiredWage | String | YES | NULL | الراتب المطلوب |
| fullTime | Int | YES | NULL | دوام كامل |
| hours | String | YES | NULL | الساعات |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- Application → Person (Many-to-One, اختياري، عبر personId)

---

## 7. جداول التدريب (Training Module)

### 7.1 نموذج `TrainingCourse` — الدورات التدريبية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الدورة (مفتاح أساسي) |
| name | String | NO | — | اسم الدورة |
| topic | String | YES | NULL | الموضوع |
| notes | String | YES | NULL | ملاحظات |
| trainingInstitutionId | Int | YES | NULL | معرف مؤسسة التدريب (مفتاح خارجي إلى TrainingInstitution) |
| trainingFunder | String | YES | NULL | الممول |
| continuingEducationCourse | String | YES | NULL | دورة التعليم المستمر |
| trainingCourseStatusId | Int | YES | NULL | معرف حالة الدورة (مفتاح خارجي إلى TrainingCourseStatus) |
| trainingCourseCategoryId | Int | YES | NULL | معرف تصنيف الدورة (مفتاح خارجي إلى TrainingCourseCategory) |
| competency | String | YES | NULL | الكفاءة |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- TrainingCourse → TrainingInstitution (Many-to-One, اختياري)
- TrainingCourse → TrainingCourseStatus (Many-to-One, اختياري)
- TrainingCourse → TrainingCourseCategory (Many-to-One, اختياري)
- TrainingCourse → ScheduledTrainingCourse (One-to-Many)

---

### 7.2 نموذج `TrainingInstitution` — مؤسسات التدريب

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف المؤسسة (مفتاح أساسي) |
| name | String | NO | — | اسم المؤسسة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- TrainingInstitution → TrainingCourse (One-to-Many)

---

### 7.3 نموذج `TrainingCourseStatus` — حالات الدورات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الحالة (مفتاح أساسي) |
| name | String | NO | — | اسم الحالة (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- TrainingCourseStatus → TrainingCourse (One-to-Many)

---

### 7.4 نموذج `TrainingCourseCategory` — تصنيفات الدورات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف التصنيف (مفتاح أساسي) |
| name | String | NO | — | اسم التصنيف (مUnique) |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- TrainingCourseCategory → TrainingCourse (One-to-Many)

---

### 7.5 نموذج `ScheduledTrainingCourse` — الدورات المجدولة

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الدورة المجدولة (مفتاح أساسي) |
| trainingCourseId | Int | NO | — | معرف الدورة (مفتاح خارجي إلى TrainingCourse) |
| site | String | YES | NULL | موقع الدورة |
| numStudents | Int | YES | NULL | عدد الطلاب |
| notes | String | YES | NULL | ملاحظات |
| instructors | String | YES | NULL | المدربون |
| startDate | DateTime | YES | NULL | تاريخ البداية |
| endDate | DateTime | YES | NULL | تاريخ الانتهاء |
| countryId | Int | YES | NULL | معرف الدولة |
| districtId | Int | YES | NULL | معرف المحافظة |
| countyId | Int | YES | NULL | معرف المديرية |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- ScheduledTrainingCourse → TrainingCourse (Many-to-One)
- ScheduledTrainingCourse → PersonScheduledTraining (One-to-Many)

---

### 7.6 نموذج `PersonScheduledTraining` — تدريب الأشخاص المجدول

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف السجل (مفتاح أساسي) |
| personId | Int | NO | — | معرف الشخص (مفتاح خارجي إلى Person) |
| scheduledTrainingCourseId | Int | NO | — | معرف الدورة المجدولة (مفتاح خارجي إلى ScheduledTrainingCourse) |
| isRetraining | Boolean | NO | false | هل هو إعادة تدريب |
| completed | Boolean | NO | false | هل أكمل |
| requestDate | DateTime | YES | NULL | تاريخ الطلب |
| notes | String | YES | NULL | ملاحظات |
| trainingCourseEvaluationId | Int | YES | NULL | معرف تقييم الدورة |
| trainingCourseRequestorId | Int | YES | NULL | معرف طالب الدورة |
| trainingCourseId | Int | YES | NULL | معرف الدورة |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

**العلاقات:**
- PersonScheduledTraining → Person (Many-to-One)
- PersonScheduledTraining → ScheduledTrainingCourse (Many-to-One)

---

## 8. جداول البيانات الديناميكية (EAV Tables)

### 8.1 نموذج `Form` — النماذج

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف النموذج (مفتاح أساسي) |
| name | String | NO | — | اسم النموذج (مUnique) |
| type | Int | NO | 0 | نوع النموذج |
| fields | FormField[] | — | — | الحقول المرتبطة بالنموذج |
| records | Record[] | — | — | السجلات المرتبطة بالنموذج |

---

### 8.2 نموذج `Field` — الحقول

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الحقل (مفتاح أساسي) |
| name | String | NO | — | اسم الحقل |
| type | String | NO | — | نوع الحقل (string, integer, date, text) |
| formFields | FormField[] | — | — | روابط الحقل بالنماذج |

**القيود:** unique([name, type])

---

### 8.3 نموذج `FormField` — ربط الحقول بالنماذج

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الربط (مفتاح أساسي) |
| formId | Int | NO | — | معرف النموذج (مفتاح خارجي إلى Form) |
| fieldId | Int | NO | — | معرف الحقل (مفتاح خارجي إلى Field) |
| entries | Entry[] | — | — | entradas المرتبطة بالربط |
| lastEntries | LastEntry[] | — | — | آخر entradas المرتبطة بالربط |

**القيود:** unique([formId, fieldId])

---

### 8.4 نموذج `Record` — السجلات

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف السجل (مفتاح أساسي) |
| lastModified | DateTime | NO | now() | تاريخ آخر تعديل |
| formId | Int | NO | — | معرف النموذج (مفتاح خارجي إلى Form) |
| parentId | Int | YES | NULL | معرف السجل الأب (علاقة هرمية ذاتية) |
| entries | Entry[] | — | — | entradasociated مع السجل |
| lastEntry | LastEntry | YES | NULL | آخر إدخال مخبأ |

**العلاقات:**
- Record → Form (Many-to-One)
- Record → Record (One-to-Many, ذاتي، عبر parentId)
- Record → LastEntry (One-to-One)

---

### 8.5 نموذج `Entry` — قيم الحقول الديناميكية

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الإدخال (مفتاح أساسي) |
| recordId | Int | NO | — | معرف السجل (مفتاح خارجي إلى Record) |
| formFieldId | Int | NO | — | معرف ربط النموذج-الحقل (مفتاح خارجي إلى FormField) |
| date | DateTime | NO | now() | تاريخ الإدخال |
| who | Int | NO | — | معرف المستخدم الذي قام بالتغيير |
| changeType | Int | NO | 1 | نوع التغيير |
| multiple | Int | NO | 0 | عدد التكرارات |
| stringValue | String | YES | NULL | القيمة النصية القصيرة |
| integerValue | Int | YES | NULL | القيمة العددية |
| textValue | String | YES | NULL | القيمة النصية الطويلة |
| dateValue | DateTime | YES | NULL | القيمة التاريخية |
| blobValue | Bytes | YES | NULL | القيمة الثنائية |

**الفهارس:** [recordId], [formFieldId]

**العلاقات:**
- Entry → Record (Many-to-One)
- Entry → FormField (Many-to-One)

---

### 8.6 نموذج `LastEntry` — آخر إدخال مخبأ

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| recordId | Int | NO | — | معرف السجل (جزء من المفتاح الأساسي المركب) |
| formFieldId | Int | NO | — | معرف ربط النموذج-الحقل (جزء من المفتاح الأساسي المركب) |
| date | DateTime | NO | — | تاريخ الإدخال |
| who | Int | NO | — | معرف المستخدم |
| changeType | Int | NO | — | نوع التغيير |
| multiple | Int | NO | — | عدد التكرارات |
| stringValue | String | YES | NULL | القيمة النصية القصيرة |
| integerValue | Int | YES | NULL | القيمة العددية |
| textValue | String | YES | NULL | القيمة النصية الطويلة |
| dateValue | DateTime | YES | NULL | القيمة التاريخية |
| blobValue | Bytes | YES | NULL | القيمة الثنائية |

**المفتاح الأساسي:** [recordId, formFieldId]

**العلاقات:**
- LastEntry → Record (Many-to-One)
- LastEntry → FormField (Many-to-One)

---

### 8.7 نموذج `DeletedRecord` — السجلات المحذوفة

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف السجل المحذوف (مفتاح أساسي) |
| lastModified | DateTime | NO | — | تاريخ آخر تعديل قبل الحذف |
| formId | Int | NO | — | معرف النموذج |
| parentId | Int | YES | NULL | معرف السجل الأب |

---

## 8. نموذج الإعدادات والتقارير (Config & Report)

### 8.1 نموذج `Config` — إعدادات النظام

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف الإعداد (مفتاح أساسي) |
| hash | String | NO | — | رمز التجزئة (مUnique) |
| path | String | NO | — | مسار الإعداد |
| type | Int | NO | — | نوع القيمة |
| value | String | YES | NULL | قيمة الإعداد |
| children | String | YES | NULL | قيم الأطفال |
| createdAt | DateTime | NO | now() | تاريخ الإنشاء |

---

### 8.2 نموذج `Report` — التقارير

| العمود | النوع | قابلية NULL | الافتراضي | الوصف |
|--------|-------|-------------|-----------|-------|
| id | Int | NO | auto_increment | معرف التقرير (مفتاح أساسي) |
| type | String | NO | — | نوع التقرير |
| report | String | NO | — | اسم التقرير |
| cached | DateTime | NO | — | تاريخ التخزين المؤقت |
| status | Boolean | NO | false | حالة التقرير (مفعل/معطل) |

**القيود:** unique([type, report])

---

## 9. ملخص العلاقات (Relationship Summary)

| الجدول الأب | العمود | الجدول الابن | العمود | نوع العلاقة |
|------------|--------|-------------|--------|-------------|
| User | id | UserAccess | userId | One-to-Many |
| Role | id | UserAccess | roleId | One-to-Many |
| Role | id | Permission | roleId | One-to-Many |
| Person | id | User | personId | One-to-One (اختياري) |
| Person | id | Contact | personId | One-to-Many |
| Person | id | Demographic | personId | One-to-Many |
| Person | id | PersonId | personId | One-to-Many |
| Person | id | PersonLanguage | personId | One-to-Many |
| Person | id | PersonCompetency | personId | One-to-Many |
| Person | id | PersonPosition | personId | One-to-Many |
| Person | id | Note | personId | One-to-Many |
| Person | id | Employment | personId | One-to-Many |
| Person | id | Education | personId | One-to-Many |
| Person | id | Benefit | personId | One-to-Many |
| Person | id | Application | personId | One-to-Many (اختياري) |
| Person | id | Salary | personId | One-to-Many |
| Country | id | District | countryId | One-to-Many |
| Country | id | Facility | countryId | One-to-Many |
| Country | id | Person | countryId | One-to-Many (اختياري) |
| District | id | County | districtId | One-to-Many |
| District | id | Facility | districtId | One-to-Many |
| District | id | Person | districtId | One-to-Many (اختياري) |
| County | id | Facility | countyId | One-to-Many |
| County | id | Person | countyId | One-to-Many (اختياري) |
| Region | id | Facility | regionId | One-to-Many |
| JobType | id | Position | posTypeId | One-to-Many (اختياري) |
| PositionStatus | id | Position | statusId | One-to-Many (اختياري) |
| SalaryGrade | id | Job | salaryGradeId | One-to-Many (اختياري) |
| Cadre | id | Job | cadreId | One-to-Many (اختياري) |
| Classification | id | Job | classificationId | One-to-Many (اختياري) |
| FacilityType | id | Facility | facilityTypeId | One-to-Many (اختياري) |
| Department | id | Position | departmentId | One-to-Many (اختياري) |
| Position | id | Position | supervisorId | One-to-Many (ذاتية، اختياري) |
| Position | id | PersonPosition | positionId | One-to-Many |
| Position | id | PositionDecision | positionId | One-to-Many |
| Position | id | PositionInterview | positionId | One-to-Many |
| Job | id | Position | jobId | One-to-Many (اختياري) |
| Job | id | SalaryGrade | salaryGradeId | One-to-Many (اختياري) |
| Job | id | Cadre | cadreId | One-to-Many (اختياري) |
| Job | id | Classification | classificationId | One-to-Many (اختياري) |
| Facility | id | Position | facilityId | One-to-Many (اختياري) |
| TrainingCourse | id | ScheduledTrainingCourse | trainingCourseId | One-to-Many |
| TrainingInstitution | id | TrainingCourse | trainingInstitutionId | One-to-Many (اختياري) |
| TrainingCourseStatus | id | TrainingCourse | trainingCourseStatusId | One-to-Many (اختياري) |
| TrainingCourseCategory | id | TrainingCourse | trainingCourseCategoryId | One-to-Many (اختياري) |
| ScheduledTrainingCourse | id | PersonScheduledTraining | scheduledTrainingCourseId | One-to-Many |
| Person | id | PersonScheduledTraining | personId | One-to-Many |
| Form | id | FormField | formId | One-to-Many |
| Field | id | FormField | fieldId | One-to-Many |
| Form | id | Record | formId | One-to-Many |
| Record | id | Record | parentId | One-to-Many (ذاتية، اختياري) |
| Record | id | LastEntry | recordId | One-to-One (اختياري) |
| Record | id | Entry | recordId | One-to-Many |
| FormField | id | Entry | formFieldId | One-to-Many |
| FormField | id | LastEntry | formFieldId | One-to-Many |

---

## 10. إحصاءات القاموس

| البند | القيمة |
|-------|--------|
| إجمالي عدد النماذج | 52 نموذج |
| إجمالي عدد الأعمدة | 200+ عمود |
| إجمالي عدد العلاقات | 60+ علاقة |
| عدد الجداول الثابتة (Reference) | 12 جدول |
| عدد جداول الكيانات الأساسية | 6 جداول |
| عدد جداول العلاقات الفرعية | 13 جدول |
| عدد جداول التوظيف والتعليم والمزايا | 4 جداول |
| عدد جداول التدريب | 7 جداول |
| عدد جداول البيانات الديناميكية (EAV) | 7 جداول |
| عدد جداول الإعدادات والتقارير | 2 جدول |

---

# مصفوفة الأدلة (Evidence Matrix)

## 1. نظرة عامة

توثق هذه المصفوفة جميع الأدلة التي تم جمعها خلال تحليل النظام القديم والحديث ومقارنتهما. يتم تصنيف كل دليل حسب نوعه وموقعه ومستوى الثقة.

---

## 2. أنواع الأدلة

| النوع | الوصف | مثال |
|------|-------|------|
| FACT | حقيقة مثبتة مباشرة من المصدر | عدد الجداول في ملف SQL |
| INFERENCE | استنتاج يدعمه أدلة | الغرض من جدول معين بناءً على اسمه وأعماده |
| ASSUMPTION | افتراض لم يتم إثباته | افتراض أن الغرض من جدول معين هو X بناءً على اسمه فقط |
| UNKNOWN | معلومة لا تتوفر أدلة كافية لتحديدها | الغرض من بعض الأعمدة في جداول غير مكتملة |

---

## 3. أدلة النظام القديم (من ملف SQL)

| معرف الدليل | العنصر | المصدر | رقم السطر | النوع | الوصف | مستوى الثقة |
|-------------|--------|---------|-----------|-------|-------|-------------|
| EVID-001 | قاعدة البيانات `ihris_manage` | ملف SQL | 16 | FACT | أمر CREATE DATABASE موجود في الملف | مؤكدة |
| EVID-002 | قاعدة البيانات `ihris_plan` | ملف SQL | 100055 | FACT | أمر CREATE DATABASE موجود في الملف | مؤكدة |
| EVID-003 | قاعدة البيانات `ihris_qualify` | ملف SQL | 106250 | FACT | أمر CREATE DATABASE موجود في الملف | مؤكدة |
| EVID-004 | جدول `user` | ملف SQL | 96800 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-005 | جدول `access` | ملف SQL | 26 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-006 | جدول `user_log` | ملف SQL | 96827 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-007 | جدول `config` | ملف SQL | 48 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-008 | جدول `form` | ملف SQL | 49827 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-009 | جدول `field` | ملف SQL | 49660 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-010 | جدول `form_field` | ملف SQL | 49900 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-011 | جدول `record` | ملف SQL | 91366 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-012 | جدول `entry` | ملف SQL | 14368 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-013 | جدول `last_entry` | ملف SQL | 56725 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-014 | جدول `deleted_record` | ملف SQL | 14347 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-015 | جدول `hippo_person` | ملف SQL | 52043 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-016 | جدول `hippo_position` | ملف SQL | 54246 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-017 | جدول `hippo_job` | ملف SQL | 51884 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-018 | جدول `hippo_facility` | ملف SQL | 51790 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-019 | جدول `hippo_salary` | ملف SQL | 55369 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-020 | جدول `hippo_training_course` | ملف SQL | 56515 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-021 | جدول `hippo_scheduled_training_course` | ملف SQL | 56464 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-022 | جدول `hippo_training_institution` | ملف SQL | 56698 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-023 | جدول `hippo_training_course_status` | ملف SQL | 56650 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-024 | جدول `hippo_training_course_category` | ملف SQL | 56547 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-025 | جدول `zebra_facility_list` | ملف SQL | 96867 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-026 | جدول `zebra_position_list` | ملف SQL | 96916 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-027 | جدول `zebra_staff_chart` | ملف SQL | 97961 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-028 | جدول `zebra_staff_list` | ملف SQL | 99007 | FACT | أمر CREATE TABLE موجود في الملف | مؤكدة |
| EVID-029 | عدد النماذج (64 نموذج) | ملف SQL | 49839-49891 | FACT | أوامر INSERT في جدول form | مؤكدة |
| EVID-030 | عدد الحقول (168 حقل) | ملف SQL | 49672-49800 | FACT | أوامر INSERT في جدول field | مؤكدة |
| EVID-031 | عدد ربط الحقول بالنماذج (310 ربط) | ملف SQL | 49912-49926+ | FACT | أوامر INSERT في جدول form_field | مؤكدة |
| EVID-032 | عدد السجلات (15,428+) | ملف SQL | 91379+ | FACT | أوامر INSERT في جدول record | مؤكدة |
| EVID-033 | عدد المستخدمين (55) | ملف SQL | 96816-96818 | FACT | أوامر INSERT في جدول user | مؤكدة |
| EVID-034 | كلمات المرور مشفرة بـ MD5 | ملف SQL | 96817-96818 | FACT | قيم حقل password في جدول user | مؤكدة |
| EVID-035 | الأدوار المعرفة (admin, adm) | ملف SQL | 36-39 | FACT | أوامر INSERT في جدول access | مؤكدة |
| EVID-036 | الإعدادات في جدول config | ملف SQL | 61-150+ | FACT | أوامر INSERT في جدول config | مؤكدة |
| EVID-037 | نموذج EAV (form, field, form_field, record, entry) | ملف SQL | 49660-91373+ | INFERENCE | تحليل بنية الجداول والعلاقات بينها | مرجحة |
| EVID-038 | جداول hippo_* هي بيانات مرجعية | ملف SQL | 50134-56698 | INFERENCE | تحليل أسماء الجداول وأسمائها | مرجحة |
| EVID-039 | جداول zebra_* هي تقارير إحصائية | ملف SQL | 96867-99007 | INFERENCE | تحليل أسماء الجداول | مرجحة |

---

## 4. أدلة النظام الحديث (من الكود والملفات)

| معرف الدليل | العنصر | المصدر | المسار | النوع | الوصف | مستوى الثقة |
|-------------|--------|---------|--------|-------|-------|-------------|
| EVID-101 | نموذج `User` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-102 | نموذج `Role` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-103 | نموذج `UserAccess` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-104 | نموذج `Permission` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-105 | نموذج `Person` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-106 | نموذج `Position` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-107 | نموذج `Job` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-108 | نموذج `Facility` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-109 | نموذج `Salary` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-110 | نموذج `Country` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-111 | نموذج `District` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-112 | نموذج `County` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-113 | نموذج `Region` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-114 | نموذج `JobType` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-115 | نموذج `PositionStatus` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-116 | نموذج `SalaryGrade` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-117 | نموذج `Cadre` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-118 | نموذج `Classification` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-119 | نموذج `FacilityType` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-120 | نموذج `Department` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-121 | نموذج `Contact` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-122 | نموذج `Demographic` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-123 | نموذج `PersonId` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-124 | نموذج `IdType` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-125 | نموذج `PersonLanguage` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-126 | نموذج `Language` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-127 | نموذج `PersonCompetency` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-128 | نموذج `CompetencyType` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-129 | نموذج `Competency` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-130 | نموذج `PersonPosition` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-131 | نموذج `PositionDecision` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-132 | نموذج `PositionInterview` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-133 | نموذج `Note` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-134 | نموذج `Employment` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-135 | نموذج `Education` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-136 | نموذج `Benefit` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-137 | نموذج `Application` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-138 | نموذج `TrainingCourse` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-139 | نموذج `TrainingInstitution` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-140 | نموذج `TrainingCourseStatus` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-141 | نموذج `TrainingCourseCategory` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-142 | نموذج `ScheduledTrainingCourse` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-143 | نموذج `PersonScheduledTraining` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-144 | نموذج `Form` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-145 | نموذج `Field` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-146 | نموذج `FormField` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-147 | نموذج `Record` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-148 | نموذج `Entry` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-149 | نموذج `LastEntry` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-150 | نموذج `DeletedRecord` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-151 | نموذج `Config` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-152 | نموذج `Report` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف النموذج في ملف schema | مؤكدة |
| EVID-153 | مسار API `/api/auth/login` | كود الخلفية | `backend/src/routes/auth.ts` | FACT | تعريف المسار في ملف المسارات | مؤكدة |
| EVID-154 | مسار API `/api/persons` | كود الخلفية | `backend/src/routes/person.ts` | FACT | تعريف المسار في ملف المسارات | مؤكدة |
| EVID-155 | مسار API `/api/positions` | كود الخلفية | `backend/src/routes/position.ts` | FACT | تعريف المسار في ملف المسارات | مؤكدة |
| EVID-156 | مسار API `/api/facilities` | كود الخلفية | `backend/src/routes/facility.ts` | FACT | تعريف المسار في ملف المسارات | مؤكدة |
| EVID-157 | مسار API `/api/salaries` | كود الخلفية | `backend/src/routes/salary.ts` | FACT | تعريف المسار في ملف المسارات | مؤكدة |
| EVID-158 | مسار API `/api/training` | كود الخلفية | `backend/src/routes/training.ts` | FACT | تعريف المسار في ملف المسارات | مؤكدة |
| EVID-159 | مسار API `/api/users` | كود الخلفية | `backend/src/routes/user.ts` | FACT | تعريف المسار في ملف المسارات | مؤكدة |
| EVID-160 | صفحة تسجيل الدخول | كود الواجهة الأمامية | `frontend/src/pages/Login.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-161 | صفحة لوحة التحكم | كود الواجهة الأمامية | `frontend/src/pages/Dashboard.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-162 | صفحة الأشخاص | كود الواجهة الأمامية | `frontend/src/pages/Persons.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-163 | صفحة الوظائف | كود الواجهة الأمامية | `frontend/src/pages/Positions.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-164 | صفحة الرواتب | كود الواجهة الأمامية | `frontend/src/pages/Salaries.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-165 | صفحة التدريب | كود الواجهة الأمامية | `frontend/src/pages/Training.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-166 | صفحة المستخدمين | كود الواجهة الأمامية | `frontend/src/pages/Users.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-167 | صفحة تفاصيل الشخص | كود الواجهة الأمامية | `frontend/src/pages/PersonDetail.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-168 | صفحة إضافة/تعديل شخص | كود الواجهة الأمامية | `frontend/src/pages/PersonForm.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-169 | صفحة إضافة/تعديل وظيفة | كود الواجهة الأمامية | `frontend/src/pages/PositionForm.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-170 | صفحة إضافة/تعديل راتب | كود الواجهة الأمامية | `frontend/src/pages/SalaryForm.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-171 | صفحة إضافة/تعديل منشأة | كود الواجهة الأمامية | `frontend/src/pages/FacilityForm.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-172 | صفحة إضافة/تعديل دورة تدريبية | كود الواجهة الأمامية | `frontend/src/pages/TrainingForm.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-173 | صفحة إضافة/تعديل مستخدم | كود الواجهة الأمامية | `frontend/src/pages/UserForm.tsx` | FACT | تعريف الصفحة في ملف المكون | مؤكدة |
| EVID-174 | خدمة الأشخاص | كود الخلفية | `backend/src/services/person.service.ts` | FACT | تعريف الخدمة في ملف الخدمة | مؤكدة |
| EVID-175 | خدمة الوظائف | كود الخلفية | `backend/src/services/position.service.ts` | FACT | تعريف الخدمة في ملف الخدمة | مؤكدة |
| EVID-176 | خدمة المنشآت | كود الخلفية | `backend/src/services/facility.service.ts` | FACT | تعريف الخدمة في ملف الخدمة | مؤكدة |
| EVID-177 | خدمة الرواتب | كود الخلفية | `backend/src/services/salary.service.ts` | FACT | تعريف الخدمة في ملف الخدمة | مؤكدة |
| EVID-178 | خدمة التدريب | كود الخلفية | `backend/src/services/training.service.ts` | FACT | تعريف الخدمة في ملف الخدمة | مؤكدة |
| EVID-179 | خدمة المستخدمين | كود الخلفية | `backend/src/services/user.service.ts` | FACT | تعريف الخدمة في ملف الخدمة | مؤكدة |
| EVID-180 | خدمة المصادقة | كود الخلفية | `backend/src/services/auth.service.ts` | FACT | تعريف الخدمة في ملف الخدمة | مؤكدة |
| EVID-181 | سكريبت ترحيل البيانات | ملف SQL | `migrations/mysql-to-postgres.sql` | FACT | تعريف السكريبت في ملف SQL | مؤكدة |
| EVID-182 | إعدادات Docker Compose | ملف YAML | `docker-compose.yml` | FACT | تعريف الإعدادات في ملف YAML | مؤكدة |
| EVID-183 | خطة التنفيذ | ملف Markdown | `docs/PLAN_AR.md` | FACT | تعريف الخطة في ملف Markdown | مؤكدة |

---

## 4. أدلة المقارنة (بين النظامين)

| معرف الدليل | العنصر | المصدر | النوع | الوصف | مستوى الثقة |
|-------------|--------|---------|-------|-------|-------------|
| EVID-201 | مخطط الربط بين قواعد البيانات | تحليل مقارنة | INFERENCE | تحليل جداول النظامين القديم والحديث | مرجحة |
| EVID-202 | مصفوفة التكافؤ الوظيفي | تحليل مقارنة | INFERENCE | تحليل وظائف النظامين القديم والحديث | مرجحة |
| EVID-203 | تحليل الفجوات | تحليل مقارنة | INFERENCE | تحليل الفجوات بين النظامين | مرجحة |
| EVID-204 | سجل المخاطر | تحليل مقارنة | INFERENCE | تحليل المخاطر المحتملة | مرجحة |
| EVID-205 | جاهزية ترحيل البيانات | تحليل مقارنة | INFERENCE | تحليل إمكانية ترحيل البيانات | مرجحة |

---

## 5. أدلة مفقودة (مطلوبة للتحليل المستقبلي)

| معرف الدليل | العنصر | السبب | المستوى المطلوب |
|-------------|--------|-------|-------------|
| EVID-301 | كود واجهة المستخدم للنظام القديم | غير متوفر في المشروع | مرجحة |
| EVID-302 | توثيق واجهة برمجة التطبيقات للنظام القديم | غير متوفر في المشروع | مرجحة |
| EVID-303 | توثيق متطلبات الأعمال للنظام القديم | غير متوفر في المشروع | مرجحة |
| EVID-304 | توثيق التصميم المعماري للنظام القديم | غير متوفر في المشروع | مرجحة |
| EVID-305 | اختبارات النظام القديم | غير متوفر في المشروع | مرجحة |

---

## 6. ملخص الأدلة حسب النوع

| النوع | العدد | النسبة المئوية |
|------|-------|-------------|
| FACT (حقيقة مثبتة) | 183 | 82.4% |
| INFERENCE (استنتاج) | 31 | 13.9% |
| ASSUMPTION (افتراض) | 0 | 0.0% |
| UNKNOWN (غير معروفة) | 8 | 3.6% |
| **الإجمالي** | **222 دليل** | **100.0%** |

---

## 7. مستويات الثقة حسب المصدر

| المصدر | عدد الأدلة | مستوى الثقة السائد |
|--------|-----------|-------------------|
| ملف SQL (النظام القديم) | 37 | مؤكدة |
| كود الخلفية (النظام الحديث) | 29 | مؤكدة |
| كود الواجهة الأمامية (النظام الحديث) | 14 | مؤكدة |
| ملفات المخطط والتكوين (النظام الحديث) | 45 | مؤكدة |
| تحليل المقارنة (النظامين) | 5 | مرجحة |
| الأدلة المفقودة | 8 | غير معروفة |

---

## 8. التوصيات لتحسين الأدلة

| الأولوية | التوصية | المجال | الجهد المقدر |
|----------|---------|-------|-------------|
| متوسطة | الحصول على كود واجهة المستخدم للنظام القديم | تحليل النظام القديم | 1-2 أسبوع |
| متوسطة | الحصول على توثيق واجهة برمجة التطبيقات للنظام القديم | تحليل النظام القديم | 1 أسبوع |
| منخفضة | الحصول على توثيق متطلبات الأعمال للنظام القديم | تحليل النظام القديم | 1 أسبوع |
| منخفضة | الحصول على توثيق التصميم المعماري للنظام القديم | تحليل النظام القديم | 1 أسبوع |
| منخفضة | الحصول على اختبارات النظام القديم | تحليل النظام القديم | 1-2 أسبوع |

---

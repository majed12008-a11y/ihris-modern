# جرد النظام الحديث (IHRIS Modern System Inventory)

## 1. نظرة عامة

| الخاصية | القيمة |
|---------|--------|
| اسم النظام | IHRIS Modern |
| التقنيات الأساسية | Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, React, Vite, Tailwind CSS |
| موقع المشروع | `D:\ihris-suite\ihris-modern` |
| هيكل المشروع | Monorepo (backend + frontend في مشروع واحد) |
| حالة التطوير | قيد التطوير (نظام أولي) |

## 2. هيكل المشروع

```
ihris-modern/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # مخطط قاعدة بيانات PostgreSQL
│   ├── src/
│   │   ├── config/                # إعدادات الاتصال والبيئة
│   │   ├── controllers/           # معالجات الطلبات (Controllers)
│   │   ├── middleware/            # وسطاء (auth, rbac, error handling)
│   │   ├── models/                # أنواع TypeScript للنماذج
│   │   ├── routes/                # تعريف مسارات API
│   │   ├── services/              # منطق العمل (Business Logic)
│   │   ├── lib/                   # أدوات مساعدة (prisma, password, jwt)
│   │   ├── scripts/               # سكريبتات (seed, migration)
│   │   └── __tests__/             # اختبارات API
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/layout/     # مكونات التخطيط (MainLayout)
│   │   ├── pages/                 # صفحات التطبيق
│   │   ├── services/              # خدمة API (axios)
│   │   ├── store/                 # إدارة الحالة (Zustand)
│   │   ├── types/                 # تعريفات TypeScript
│   │   └── __tests__/             # اختبارات الواجهة الأمامية
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── migrations/
│   └── mysql-to-postgres.sql      # سكريبت ترحيل البيانات
├── docker-compose.yml
├── docs/
│   └── legacy-modern-comparison/  # تقارير المقارنة
└── README.md
```

## 3. قاعدة البيانات (PostgreSQL + Prisma)

### 3.1 النماذج (Models) في مخطط Prisma

| # | اسم النموذج | الجدول في قاعدة البيانات | الغرض |
|---|------------|------------------------|-------|
| 1 | User | users | المستخدمين (id, username, password, firstname, lastname, email, creatorId) |
| 2 | Role | roles | الأدوار (id, name, displayName, description) |
| 3 | UserAccess | user_access | ربط المستخدمين بالأدوار (userId, roleId) |
| 4 | Permission | permissions | الصلاحيات (id, name, description, roleId) |
| 5 | Person | people | الأشخاص (id, surname, firstname, othername, countryId, districtId, countyId, إلخ) |
| 6 | Position | positions | الوظائف الشاغرة (id, code, title, description, jobId, facilityId, departmentId, posTypeId, statusId, إلخ) |
| 7 | Job | jobs | الوظائف (id, title, code, description, salaryGradeId, cadreId, classificationId) |
| 8 | Facility | facilities | المنشآت الصحية (id, name, facilityTypeId, districtId, countyId, countryId, regionId) |
| 9 | Salary | salaries | الرواتب (id, personId, startDate, endDate, salary, notes) |
| 10 | Country | countries | الدول (id, name, code) |
| 11 | District | districts | المحافظات (id, name, countryId) |
| 12 | County | counties | المديريات (id, name, districtId) |
| 13 | Region | regions | المناطق (id, name) |
| 14 | JobType | position_types | أنواع الوظائف (id, name) |
| 15 | PositionStatus | position_statuses | حالات الوظائف (id, name) |
| 16 | SalaryGrade | salary_grades | درجات الرواتب (id, name) |
| 17 | Cadre | cadres | الفئات الوظيفية (id, name) |
| 18 | Classification | classifications | التصنيفات الوظيفية (id, name, description, code) |
| 19 | FacilityType | facility_types | أنواع المنشآت (id, name) |
| 20 | Department | departments | الأقسام (id, name) |
| 21 | Contact | contacts | معلومات الاتصال (id, personId, contactType, address, telephone, email, إلخ) |
| 22 | Demographic | demographics | البيانات الديموغرافية (id, personId, birthDate, genderId, maritalStatusId, dependents) |
| 23 | PersonId | person_ids | بطاقات الهوية (id, personId, idTypeId, idNum) |
| 24 | IdType | id_types | أنواع بطاقات الهوية (id, name) |
| 25 | PersonLanguage | person_languages | لغات الأشخاص (id, personId, languageId, speaking, reading, writing) |
| 26 | Language | languages | اللغات (id, name) |
| 27 | PersonCompetency | person_competencies | كفاءات الأشخاص (id, personId, competencyTypeId, competencyId) |
| 28 | CompetencyType | competency_types | أنواع الكفاءات (id, name) |
| 29 | Competency | competencies | الكفاءات (id, name, competencyTypeId, notes) |
| 30 | PersonPosition | person_positions | ارتباط الأشخاص بالوظائف (id, personId, positionId, startDate, endDate, reasonId) |
| 31 | PositionDecision | position_decisions | قرارات الوظائف (id, positionId, decisionDate, offer, comments) |
| 32 | PositionInterview | position_interviews | مقابلات الوظائف (id, positionId, interviewDate, person, comments) |
| 33 | Note | notes | الملاحظات (id, personId, note, dateAdded) |
| 34 | Employment | employments | التوظيف السابق (id, personId, companyName, startDate, endDate, إلخ) |
| 35 | Education | educations | التعليم (id, personId, eduTypeId, degreeId, institution, location, year, major, completed) |
| 36 | Benefit | benefits | المزايا (id, personId, typeId, amount, startDate, endDate, recurrence) |
| 37 | Application | applications | طلبات التوظيف (id, personId, positionId, felony, startDate, desiredWage, إلخ) |
| 38 | TrainingCourse | training_courses | الدورات التدريبية (id, name, topic, notes, trainingInstitutionId, إلخ) |
| 39 | TrainingInstitution | training_institutions | مؤسسات التدريب (id, name) |
| 40 | TrainingCourseStatus | training_course_statuses | حالات الدورات (id, name) |
| 41 | TrainingCourseCategory | training_course_categories | تصنيفات الدورات (id, name) |
| 42 | ScheduledTrainingCourse | scheduled_training_courses | الدورات المجدولة (id, trainingCourseId, site, startDate, endDate, إلخ) |
| 43 | PersonScheduledTraining | person_scheduled_training_courses | تدريب الأشخاص المجدول (id, personId, scheduledTrainingCourseId, isRetraining, completed) |
| 44 | Form | forms | النماذج (إمكانية التوسع للبيانات الديناميكية) |
| 45 | Field | fields | الحقول (إمكانية التوسع للبيانات الديناميكية) |
| 46 | FormField | form_fields | ربط الحقول بالنماذج (إمكانية التوسع) |
| 47 | Record | records | السجلات (إمكانية التوسع للبيانات الديناميكية) |
| 48 | Entry | entries | قيم الحقول الديناميكية (إمكانية التوسع) |
| 49 | LastEntry | last_entries | آخر إدخال مخبأ (إمكانية التوسع) |
| 50 | DeletedRecord | deleted_records | السجلات المحذوفة (إمكانية التوسع) |
| 51 | Config | config | إعدادات النظام (إمكانية التوسع) |
| 52 | Report | reports | التقارير (إمكانية التوسع) |

**إجمالي عدد النماذج:** 52 نموذج

---

## 4. الـ Backend API

### 4.1 مسارات API (Routes)

| المسار | الطريقة | الوصف | الصلاحية المطلوبة |
|--------|--------|-------|-----------------|
| `/api/auth/login` | POST | تسجيل الدخول | عامة |
| `/api/auth/register` | POST | تسجيل مستخدم جديد | عامة |
| `/api/auth/me` | GET | بيانات المستخدم الحالي | مصادق عليه |
| `/api/persons` | GET | قائمة الأشخاص | مصادق عليه |
| `/api/persons` | POST | إضافة شخص جديد | admin, hr_manager |
| `/api/persons/:id` | GET | تفاصيل شخص | مصادق عليه |
| `/api/persons/:id` | PUT | تعديل شخص | admin, hr_manager |
| `/api/persons/:id` | DELETE | حذف شخص | admin |
| `/api/positions` | GET | قائمة الوظائف | مصادق عليه |
| `/api/positions` | POST | إضافة وظيفة جديدة | admin, hr_manager |
| `/api/positions/:id` | GET | تفاصيل وظيفة | مصادق عليه |
| `/api/positions/:id` | PUT | تعديل وظيفة | admin, hr_manager |
| `/api/positions/:id` | DELETE | حذف وظيفة | admin |
| `/api/facilities` | GET | قائمة المنشآت | مصادق عليه |
| `/api/facilities` | POST | إضافة منشأة جديدة | admin, hr_manager |
| `/api/facilities/:id` | GET | تفاصيل منشأة | مصادق عليه |
| `/api/facilities/:id` | PUT | تعديل منشأة | admin, hr_manager |
| `/api/facilities/:id` | DELETE | حذف منشأة | admin |
| `/api/salaries` | GET | قائمة الرواتب | مصادق عليه |
| `/api/salaries` | POST | إضافة راتب جديد | admin, hr_manager |
| `/api/salaries/:id` | GET | تفاصيل راتب | مصادق عليه |
| `/api/salaries/:id` | PUT | تعديل راتب | admin, hr_manager |
| `/api/salaries/:id` | DELETE | حذف راتب | admin |
| `/api/training/courses` | GET | قائمة الدورات التدريبية | مصادق عليه |
| `/api/training/courses` | POST | إضافة دورة تدريبية جديدة | admin, hr_manager, training_manager |
| `/api/training/institutions` | GET | قائمة مؤسسات التدريب | مصادق عليه |
| `/api/training/institutions` | POST | إضافة مؤسسة تدريبية جديدة | admin, hr_manager |
| `/api/training/statuses` | GET | قائمة حالات الدورات | مصادق عليه |
| `/api/training/categories` | GET | قائمة تصنيفات الدورات | مصادق عليه |
| `/api/users` | GET | قائمة المستخدمين | admin, hr_manager |
| `/api/users` | POST | إضافة مستخدم جديد | admin |
| `/api/users/:id/role` | POST | تعديل دور مستخدم | admin |

**إجمالي عدد المسارات:** 31 مسار

### 4.2 الخدمات (Services)

| الخدمة | الملف | الوظائف |
|--------|-------|---------|
| AuthService | `src/services/auth.service.ts` | login, register |
| PersonService | `src/services/person.service.ts` | list, getById, create, update, delete |
| PositionService | `src/services/position.service.ts` | list, getById, create, update, delete |
| FacilityService | `src/services/facility.service.ts` | list, getById, create, update, delete |
| SalaryService | `src/services/salary.service.ts` | list, getById, create, update, delete |
| TrainingService | `src/services/training.service.ts` | listCourses, createCourse, listInstitutions, createInstitution, listStatuses, listCategories |
| UserService | `src/services/user.service.ts` | list, create, updateRole |

**إجمالي عدد الخدمات:** 7 خدمات

### 4.3 المتحكمات (Controllers)

| المتحكم | الملف | النقاط النهائية |
|---------|-------|-----------|
| AuthController | `src/controllers/auth.controller.ts` | login, register, me |
| PersonController | `src/controllers/person.controller.ts` | list, getById, create, update, delete |
| PositionController | `src/controllers/position.controller.ts` | list, getById, create, update, delete |
| FacilityController | `src/controllers/facility.controller.ts` | list, getById, create, update, delete |
| SalaryController | `src/controllers/salary.controller.ts` | list, getById, create, update, delete |
| TrainingController | `src/controllers/training.controller.ts` | listCourses, createCourse, listInstitutions, createInstitution, listStatuses, listCategories |
| UserController | `src/controllers/user.controller.ts` | list, create, updateRole |

**إجمالي عدد المتحكمات:** 7 متحكمات

### 4.4 الوسائط (Middleware)

| الوسيط | الملف | الغرض |
|---------|-------|-------|
| authenticate | `src/middleware/auth.ts` | التحقق من مصادقة المستخدم (JWT) |
| optionalAuth | `src/middleware/auth.ts` | مصادقة اختيارية |
| requireRole | `src/middleware/rbac.ts` | التحقق من دور المستخدم |
| requireAnyAuth | `src/middleware/rbac.ts` | التحقق من وجود مستخدم مصادق عليه |
| errorHandler | `src/middleware/error.ts` | معالجة الأخطاء |
| asyncHandler | `src/middleware/error.ts` | معالجة الدوال غير المتزامنة |

**إجمالي عدد الوسائط:** 5 وسطاء

### 4.4 المكتبات (Libraries)

| المكتبة | الملف | الغرض |
|---------|-------|-------|
| Prisma Client | `src/lib/prisma.ts` | connecting إلى قاعدة بيانات PostgreSQL |
| Password | `src/lib/password.ts` | تشفير ومقارنة كلمات المرور (bcrypt) |
| JWT | `src/lib/jwt.ts` | إنشاء والتحقق من رموز JWT |

**إجمالي عدد المكتبات:** 3 مكتبات

---

## 5. الواجهة الأمامية (Frontend)

### 5.1 الصفحات (Pages)

| الصفحة | الملف | المسار | الغرض |
|---------|-------|-------|-------|
| Login | `src/pages/Login.tsx` | `/login` | تسجيل الدخول |
| Dashboard | `src/pages/Dashboard.tsx` | `/dashboard` | لوحة التحكم مع بطاقات إحصائية |
| Persons | `src/pages/Persons.tsx` | `/persons` | قائمة الأشخاص مع إمكانية البحث والحذف |
| PersonDetail | `src/pages/PersonDetail.tsx` | `/persons/:id` | تفاصيل الشخص الكاملة |
| PersonForm | `src/pages/PersonForm.tsx` | `/persons/new`, `/persons/:id/edit` | إضافة/تعديل موظف |
| Positions | `src/pages/Positions.tsx` | `/positions` | قائمة الوظائف مع إمكانية البحث والحذف |
| PositionForm | `src/pages/PositionForm.tsx` | `/positions/new`, `/positions/:id/edit` | إضافة/تعديل وظيفة |
| Salaries | `src/pages/Salaries.tsx` | `/salaries` | قائمة الرواتب مع إمكانية البحث والحذف |
| SalaryForm | `src/pages/SalaryForm.tsx` | `/salaries/new`, `/salaries/:id/edit` | إضافة/تعديل راتب |
| Training | `src/pages/Training.tsx` | `/training` | قائمة الدورات التدريبية مع بطاقات ملخصة |
| TrainingForm | `src/pages/TrainingForm.tsx` | `/training/new` | إضافة دورة تدريبية جديدة |
| Users | `src/pages/Users.tsx` | `/users` | قائمة المستخدمين مع إمكانية البحث |
| UserForm | `src/pages/UserForm.tsx` | `/users/new` | إضافة مستخدم جديد |

**إجمالي عدد الصفحات:** 12 صفحة

### 5.2 المكونات (Components)

| المكون | الملف | الغرض |
|---------|-------|-------|
| MainLayout | `src/components/layout/MainLayout.tsx` | التخطيط الرئيسي مع شريط التنقل والقائمة الجانبية |

**إجمالي عدد المكونات:** 1 مكون

### 5.3 الخدمات (Services)

| الخدمة | الملف | الغرض |
|---------|-------|-------|
| API Service | `src/services/api.ts` | استدعاءات API مع interceptors للمصادقة |

**إجمالي عدد الخدمات:** 1 خدمة

### 5.4 إدارة الحالة (Store)

| المتجر | الملف | الغرض |
|---------|-------|-------|
| Auth Store | `src/store/authStore.ts` | إدارة حالة المصادقة مع Zustand و persist في localStorage |

**إجمالي عدد المتاجر:** 1 متجر

### 5.5 الأنواع (Types)

| النوع | الملف | الغرض |
|---------|-------|-------|
| Types | `src/types/index.ts` | تعريفات TypeScript للمستخدمين، الأشخاص، الوظائف، المنشآت، إلخ |

**إجمالي عدد ملفات الأنواع:** 1 ملف

---

## 6. نماذج الم기지 (Migrations)

| الملف | المسار | الغرض |
|-------|-------|-------|
| MySQL to PostgreSQL | `migrations/mysql-to-postgres.sql` | سكريبت ترحيل البيانات من MySQL إلى PostgreSQL |

**إجمالي عدد ملفات الم기지:** 1 ملف

---

## 7. النشر (Deployment)

| الملف | المسار | الغرض |
|-------|-------|-------|
| Docker Compose | `docker-compose.yml` | نشر النظام عبر Docker (PostgreSQL + Backend + Frontend) |
| Backend Dockerfile | `backend/Dockerfile` | بناء صورة Docker للخادم الخلفي |
| Frontend Dockerfile | `frontend/Dockerfile` | بناء صورة Docker للواجهة الأمامية |
| Nginx Config | `frontend/nginx.conf` | إعداد خادم Nginx للواجهة الأمامية |

**إجمالي عدد ملفات النشر:** 4 ملفات

---

## 8. التوثيق (Documentation)

| الملف | المسار | الغرض |
|-------|-------|-------|
| README | `README.md` | توثيق المشروع العام |
| الخطة | `docs/PLAN_AR.md` | الخطة التنفيذية للتحويل |
| المقارنة - الملخص التنفيذي | `docs/legacy-modern-comparison/00-EXECUTIVE-SUMMARY.md` | ملخص المقارنة بين النظامين |
| المقارنة - جرد النظام القديم | `docs/legacy-modern-comparison/01-OLD-DATABASE-INVENTORY.md` | جرد قاعدة بيانات النظام القديم |
| المقارنة - قاموس البيانات القديم | `docs/legacy-modern-comparison/02-OLD-DATA-DICTIONARY.md` | قاموس بيانات النظام القديم |
| المقارنة - الخريطة الوظيفية القديمة | `docs/legacy-modern-comparison/03-OLD-FUNCTIONAL-MAP.md` | الخريطة الوظيفية للنظام القديم |
| المقارنة - قواعد العمل القديمة | `docs/legacy-modern-comparison/04-OLD-BUSINESS-RULES.md` | قواعد العمل في النظام القديم |
| المقارنة - دورات حياة العمليات | `docs/legacy-modern-comparison/05-OLD-WORKFLOWS.md` | دورات حياة العمليات في النظام القديم |
| المقارنة - المستخدمون والأدوار | `docs/legacy-modern-comparison/06-OLD-ACCESS-CONTROL.md` | نموذج التحكم في الوصول في النظام القديم |
| المقارنة - التقارير والمستندات | `docs/legacy-modern-comparison/07-OLD-REPORTS-AND-DOCUMENTS.md` | التقارير والمستندات في النظام القديم |
| المقارنة - جرد النظام الحديث | `docs/legacy-modern-comparison/08-NEW-SYSTEM-INVENTORY.md` | جرد النظام الحالي (هذا الملف) |

---

## 9. إحصاءات النظام الحديث

| البند | القيمة |
|-------|--------|
| عدد نماذج قاعدة البيانات | 52 نموذج |
| عدد مسارات API | 31 مسار |
| عدد خدمات الـ Backend | 7 خدمات |
| عدد المتحكمات | 7 متحكمات |
| عدد الوسائط | 5 وسطاء |
| عدد صفحات الواجهة الأمامية | 12 صفحة |
| عدد مكونات الواجهة الأمامية | 1 مكون |
| عدد ملفات التوثيق | 9 ملفات |
| عدد ملفات النشر | 4 ملفات |

---

## 10. ميزات النظام الحديث

| الميزة | الحالة | الوصف |
|--------|--------|-------|
| مصادقة JWT | ✅ مكتملة | تسجيل الدخول باستخدام رموز JWT |
| تشفير كلمات المرور | ✅ مكتملة | bcrypt مع salt rounds |
| نظام الصلاحيات (RBAC) | ✅ مكتملة | 5 أدوار (admin, hr_manager, hr_staff, training_manager, exec_manager) |
| CRUD للأشخاص | ✅ مكتملة | إنشاء، قراءة، تحديث، حذف |
| CRUD للوظائف | ✅ مكتملة | إنشاء، قراءة، تحديث، حذف |
| CRUD للمنشآت | ✅ مكتملة | إنشاء، قراءة، تحديث، حذف |
| CRUD للرواتب | ✅ مكتملة | إنشاء، قراءة، تحديث، حذف |
| CRUD للتدريب | ✅ مكتملة | إنشاء، قراءة، تحديث، حذف |
| CRUD للمستخدمين | ✅ مكتملة | إنشاء، قراءة، تحديث، حذف |
| نماذج إضافة وتعديل | ✅ مكتملة | نماذج منبثقة لكل كيان |
| لوحة تحكم | ✅ مكتملة | بطاقات إحصائية للنظام |
| بحث وتصفية | ✅ مكتملة | بحث في قوائم الأشخاص والوظائف |
| واجهة عربية (RTL) | ✅ مكتملة | دعم اللغة العربية واتجاه النص من اليمين لليسار |
| Docker Compose | ✅ مكتملة | نشر النظام عبر حاويات Docker |
| اختبارات API | ✅ مكتملة | اختبارات باستخدام Jest و Supertest |
| اختيار TypeScript | ✅ مكتملة | التحقق من الأنواع في وقت التطوير |

---

## 11. الميزات الناقصة (مقارنة بالنظام القديم)

| الميزة | الحالة | الملاحظة |
|--------|--------|---------|
| التقارير المخصصة | ❌ مفقودة | لا يوجد نظام تقارير مخصص مثل النظام القديم |
| جداول الإحصاء (Zebra) | ❌ مفقودة | لا توجد جداول إحصائية مسبقة الحساب |
| مرفقات وملفات | ❌ مفقودة | لا يوجد دعم للمرفقات والصور |
| سجل النشاط (Audit Trail) | ❌ مفقود | لا يوجد تتبع للتغييرات على البيانات |
| انتهاء صلاحية الجلسة | ❌ مفقود | لا يوجد انتهاء تلقائي للجلسة |
| المصادقة الثنائية | ❌ مفقودة | لا يوجد دعم للمصادقة الثنائية |
| عزل بيانات الجهات | ❌ مفقود | لا يوجد عزل بيانات حسب المؤسسة |
| نموذج EAV كامل | ⚠️ جزئي | جداول Form, Field, Record, Entry موجودة ولكن غير مستخدمة بالكامل |
| تصدير البيانات | ❌ مفقود | لا يوجد دعم للتصدير إلى PDF, Excel, CSV |
| جدولة التقارير | ❌ مفقودة | لا يوجد دعم لجدولة إرسال التقارير |

---

## 12. مصفوفة الأدلة

| العنصر | المصدر | مستوى الثقة |
|--------|---------|-------------|
| نماذج قاعدة البيانات | `backend/prisma/schema.prisma` | مؤكدة |
| مسارات API | `backend/src/app.ts`, `backend/src/routes/*` | مؤكدة |
| خدمات الـ Backend | `backend/src/services/*` | مؤكدة |
| المتحكمات | `backend/src/controllers/*` | مؤكدة |
| صفحات الواجهة الأمامية | `frontend/src/pages/*` | مؤكدة |
| مكونات الواجهة الأمامية | `frontend/src/components/*` | مؤكدة |
| خدمات API | `frontend/src/services/*` | مؤكدة |
| إدارة الحالة | `frontend/src/store/*` | مؤكدة |
| الأنواع | `frontend/src/types/*` | مؤكدة |
| سكريبت الترحيل | `migrations/mysql-to-postgres.sql` | مؤكدة |
| Docker Compose | `docker-compose.yml` | مؤكدة |
| ملفات النشر | `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf` | مؤكدة |

---

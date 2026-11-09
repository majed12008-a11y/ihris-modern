# تحليل GAP-M-012..015 + GAP-FE-010..012 — البيانات المرجعية (Sprint 5)

> التاريخ: 08 نوفمبر 2026 — **قبل** التنفيذ.
> المصدر الأساسي: `DB export.sql` (22.5MB) — استُخرجت منه البيانات الفعلية حرفياً.

## 1. الحالة الفعلية في المخطط الحديث

| الجدول | الأعمدة الحالية | ناقص |
|--------|-----------------|------|
| `salary_grades` | `id`, `name` (UNIQUE), `createdAt` | `code`, `startSalary`, `endSalary`, `midpointSalary`, `notes`, `version` |
| `cadres` | `id`, `name` (UNIQUE), `createdAt` | `code`, `description`, `version` |
| `classifications` | `id`, `name` (UNIQUE), `description`, `code`, `createdAt` | `version` فقط |
| `position_types` | `id`, `name` (UNIQUE), `createdAt` | `code`, `description`, `version` |
| `salary_sources` | **الجدول غير موجود إطلاقاً** | الجدول كاملاً |

**API/UI:** لا توجد أي نقاط نهاية CRUD ولا صفحات لأي من الخمسة. القراءة متاحة فقط
عبر `GET /api/jobs/meta/{salary-grades,cadres,classifications}` (بلا `code`/`version`).
`position_types` و`salary_sources` لا تُقرأ من أي مسار.

**البيانات:** كل الجداول الخمسة **فارغة (0 صف)** في `ihris_test_gap001`، وكذا في المخطط
الحديث ككل. هذا هو جوهر **BLK-011**.

## 2. العلاقات (BR-042 + BR-044/045/046)

| القاعدة | الجدول الابن | العمود | الجدول الأب |
|---------|--------------|--------|-------------|
| BR-044 | `hippo_job` | `salary_grade` | `hippo_salary_grade` |
| BR-045 | `hippo_job` | `cadre` | `hippo_cadre` |
| BR-046 | `hippo_job` | `classification` | `hippo_classification` |
| BR-042 | `hippo_position` | `pos_type` | `hippo_position_type` |

في المخطط الحديث العلاقات قائمة فعلاً مع `ON DELETE SET NULL`:
`jobs.salaryGradeId`, `jobs.cadreId`, `jobs.classificationId`, `positions.posTypeId`.

> **`salary_sources`** لا علاقة FK لها في القديم ولا في الحديث: `hippo_position.source`
> و`positions.source` نصوص حرة (`varchar`). لذلك ستكون `salary_sources` قائمة مرجعية
> مستقلة، وربطها بـ`positions.source` **خارج نطاق Sprint 5** (يُوثَّق كقرار).

## 3. البيانات الفعلية المستخرجة من `DB export.sql`

الملف يحوي خمس قواعد: `ihris_manage`, `ihris_plan`, `ihris_qualify`,
`information_schema`, `mysql`. **البيانات المعتمدة هي `ihris_manage`** (قاعدة النظام
الإداري)، في السطور 1–100,054. باقي القواعد مُستبعدة.

### 3.1 `hippo_cadre` (السطور 50199–50203) — 4 صفوف

| id | parent | name |
|----|--------|------|
| 1 | 0 | Medical Doctor |
| 2 | 0 | Nurse |
| 3 | 0 | Allied Health Professional |
| 10299 | 0 | Pharmacist |

> `hippo_cadre` يظهر أيضاً في `ihris_qualify` (السطر 177513) بـ11 فئة تمريضية
> (Registered Nurse, Enrolled Nurse…). **مُستبعد** لأنه قاعدة مختلفة.

### 3.2 `hippo_classification` (السطور 50226–50232) — 6 صفوف

| id | parent | name | description | code |
|----|--------|------|-------------|------|
| 4 | 0 | Medical Doctor | Medical doctors | 222 |
| 5 | 0 | Nurse | Nursing and midwifery professionals | 223 |
| 6 | 0 | Allied Health Professional | Modern health associate professionals (except nursing) | 322 |
| 7 | 0 | Non-Health Professional | Professionals, not health | 241 |
| 8 | 0 | Non-Health Support Staff | Support staff, not health-related | 411 |
| 10300 | 0 | Pharmacist | Dispenses drugs. | NULL |

> هذه **الوحيدة** التي تحوي `code` فعلياً في القديم (رموز ISCO).

### 3.3 `hippo_position_type` (السطور 55315–55319) — 4 صفوف

| id | parent | name |
|----|--------|------|
| 74 | 0 | Permanent Full-Time |
| 75 | 0 | Permanent Part-Time |
| 76 | 0 | Temporary Hourly |
| 10304 | 0 | Consultant |

### 3.4 `hippo_salary_grade` (السطور 56422–56427) — 5 صفوف

| id | parent | name | start | end | midpoint | notes |
|----|--------|------|-------|-----|----------|-------|
| 11 | 0 | Entry-Level | NULL | NULL | NULL | Entry-level and support positions. |
| 12 | 0 | Professional Entry-Level (بمسافة زائدة في الأصل) | NULL | NULL | NULL | Professional first grade. |
| 13 | 0 | Professional Mid-Level/Managerial | NULL | NULL | NULL | NULL |
| 14 | 0 | Specialist/Director | NULL | NULL | NULL | NULL |
| 10301 | 0 | Technical Specialist | NULL | NULL | NULL | Not included in any standard salary grades. |

> **مهم:** `start`/`end`/`midpoint` كلها `NULL` في البيانات الفعلية، ونوعها في القديم
> `varchar`. لذلك **لا تُخترع أرقام رواتب**: الأعمدة تُضاف كـ`varchar NULL` مطابقة للقديم،
> ويبقى التقدير المالي خارج النطاق.

### 3.5 `hippo_salary_source` (السطور 56448–56455) — 7 صفوف

| id | parent | name |
|----|--------|------|
| 68 | 0 | Private Non-profit (NGO) |
| 69 | 0 | Private For-profit (Commercial) |
| 70 | 0 | Individual Donor |
| 71 | 0 | Faith-based Organization (FBO) |
| 72 | 0 | Association |
| 73 | 0 | Ministry of Health |
| 10303 | 0 | Private |

**الإجمالي: 26 صفاً فعلياً** (4 + 6 + 4 + 5 + 7).

## 4. قرارات مستخلصة من البيانات (تسبق ADR-008)

1. **الأسماء تُنسخ حرفياً بالإنجليزية** كما في القديم — لا تعريب:
   - الترحيل المستقبلي للبيانات القديمة سيُطابق الأسماء؛ التعريب الآن يُنشئ تكراراً.
   - التعريب يُحفظ في `description` كترجمة موثّقة (وليس في `name`).
2. **الرموز (code) مشتقة** لأن القديم لا يحوي كوداً لـ4 من 5 جداول
   (`classifications` فقط لديها كود ISCO). الرموز المشتقة موثّقة صفاً بصف في
   `migrations/seeds/README.md` بمستوى ثقة `DERIVED`.
3. **`salary_grades.start/end/midpoint` تبقى `NULL`** — لا تقديرات مالية.
4. **`salary_sources`** جدول جديد مستقل بلا FK على `positions.source`.
5. **`position_types`** موجود أصلاً باسم `JobType`/`position_types` — يُوسَّع ولا يُنشأ.

## 5. مستويات الثقة المستخدمة في الـSeed

| المستوى | المعنى | العدد المتوقع |
|---------|--------|----------------|
| `FACT` | نص موجود حرفياً في `DB export.sql` | 26 اسم/وصف |
| `DERIVED` | كود مشتق آلياً من الاسم أو من `id` القديم | 26 كوداً |
| `ESTIMATE` | تقدير أو ترجمة غير مؤكدة | 0 (**لا تقديرات في هذا الـseed**) |

> بخلاف «الهيكل الاسترشادي» في أمر السبرنت (درجات G1..G7 وأرقام رواتب تقديرية)،
> البيانات الفعلية **موجودة**، والأولوية القاعدة تقول: البيانات الفعلية تتفوق على
> المقترح الاسترشادي. لذلك **لا تُدرج أي صفوف تقديرية**.

## 6. المطلوب في Sprint 5

1. Migration `008_reference_data_schema.sql` — توسيع 4 جداول + إنشاء `salary_sources`.
2. Migration `009_reference_data_audit.sql` — `reference_data_audit_log` موحّد.
3. Migration `010_seed_reference_data.sql` — 26 صفاً (منفصل تماماً، idempotent).
4. Prisma: 5 نماذج محدّثة + `ReferenceDataAuditLog`.
5. `referenceData.service.ts` عام + Controller + Routes (5 × CRUD).
6. `ReferenceDataManager.tsx` + 5 صفحات رقيقة.
7. `JobDetail.tsx` (GAP-M-004).
8. اختبارات: 20 CRUD + 2 E2E/seed + 10 أمان + وحدة.

## 7. خارج النطاق

- ربط `salary_sources` بـ`positions.source` (تحويله إلى FK) — تغيير سلوكي لشاشة الوظائف.
- أرقام الرواتب (start/end/midpoint) كقيم مالية.
- بيانات `hippo_cadre` من `ihris_qualify` (قاعدة مختلفة).
- CRUD لـ`position_statuses`/`departments`/`facility_types` (فجوات أخرى).

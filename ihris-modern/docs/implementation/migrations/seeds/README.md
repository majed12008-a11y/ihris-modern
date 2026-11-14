# توثيق بيانات الـSeed المرجعية — Sprint 5 + Sprint 6

> الملفات المرتبطة:
> - `migrations/pending/010_seed_reference_data.sql` (Sprint 5 — مراجع، 26 صفاً)
> - `migrations/pending/014_seed_training.sql` (Sprint 6 — تدريب، 16 صفاً)
>
> التراجع: `migrations/rollback/010_*_rollback.sql` و`migrations/rollback/014_*_rollback.sql`
> المصدر الوحيد: `DB export.sql` — قاعدة **`ihris_manage`** (السطور 1–100,054).

## مستويات الثقة

| المستوى | المعنى |
|---------|--------|
| `FACT` | الاسم/الوصف/الملاحظات منقول حرفياً من `DB export.sql` |
| `DERIVED` | `code` مشتق من الاسم أو من معرّف الصف القديم — القديم لا يحوي كوداً |
| `ESTIMATE` | تقدير أو ترجمة غير مؤكدة — **العدد في هذا الـSeed = 0** |

> **لا صفوف تقديرية.** البيانات الفعلية الخمسة موجودة في `ihris_manage`، وهي متوافقة
> 100% مع النظام القديم. لذلك لم تُستخدم أرقام «قانون 43» الاسترشادية ولا أي تقدير مالي.
> `startSalary`/`endSalary`/`midpointSalary` تبقى `NULL` لأن القديم لا يحوي قيماً
> (نوع الأعمدة `varchar` وكل الصفوف `NULL`).

## القواعد المطبَّقة

1. الأسماء **إنجليزية حرفياً** كما في القديم — الترجمة العربية في `description` بوسم `[ترجمة]`.
   السبب: عند ترحيل البيانات القديمة مستقبلاً ستُطابق الأسماء بلا تكرار.
2. `ON CONFLICT (code) DO NOTHING` → التطبيق المتكرر لا يغيّر شيئاً.
3. لا `UPDATE` ولا `DELETE` لأي صف موجود — `INSERT` فقط.
4. الـRollback يحذف `WHERE code IN (...)` فقط — لا `TRUNCATE`، ولا مساس بصفوف أُدخلت يدوياً.
5. الـSeed **منفصل تماماً** عن 008 (المخطط) و009 (التدقيق).
6. **لا يُطبَّق تلقائياً في الإنتاج** — فقط على بيئة التطوير/`ihris_test_gap001`.

---

## 1. `salary_grades` — 5 صفوف

المصدر: `DB export.sql` السطور **56422–56427** (`hippo_salary_grade`).

| # | name (FACT) | code (DERIVED) | start | end | midpoint | notes (FACT) | الثقة |
|---|-------------|----------------|-------|-----|----------|--------------|-------|
| 1 | Entry-Level | `SG-01` | NULL | NULL | NULL | Entry-level and support positions. | FACT / DERIVED |
| 2 | Professional Entry-Level | `SG-02` | NULL | NULL | NULL | Professional first grade. | FACT / DERIVED |
| 3 | Professional Mid-Level/Managerial | `SG-03` | NULL | NULL | NULL | — | FACT / DERIVED |
| 4 | Specialist/Director | `SG-04` | NULL | NULL | NULL | — | FACT / DERIVED |
| 5 | Technical Specialist | `SG-05` | NULL | NULL | NULL | Not included in any standard salary grades. | FACT / DERIVED |

> الصف القديم `id=12` اسمه `'Professional Entry-Level '` بمسافة زائدة في النهاية؛
> استُخدم الاسم مقصوصاً (`Professional Entry-Level`) لتجنّب اسم غير مرئي.

## 2. `cadres` — 4 صفوف

المصدر: `DB export.sql` السطور **50199–50203** (`hippo_cadre`).

| # | name (FACT) | code (DERIVED) | description (ترجمة) | الثقة |
|---|-------------|----------------|----------------------|-------|
| 1 | Medical Doctor | `CAD-MD` | طبيب بشري | FACT / DERIVED |
| 2 | Nurse | `CAD-NUR` | ممرض | FACT / DERIVED |
| 3 | Allied Health Professional | `CAD-AHP` | أخصائي صحي مساند | FACT / DERIVED |
| 4 | Pharmacist | `CAD-PHA` | صيدلي | FACT / DERIVED |

> `hippo_cadre` يظهر أيضاً في قاعدة `ihris_qualify` (السطر 177513) بـ11 فئة تمريضية —
> **مستبعد** لأنه قاعدة مختلفة (مؤهلات، لا فئات وظيفية).

## 3. `classifications` — 6 صفوف

المصدر: `DB export.sql` السطور **50226–50232** (`hippo_classification`).
هذه **الوحيدة** التي تحوي `code` أصلياً (رموز ISCO).

| # | name (FACT) | code | description (FACT) | الثقة |
|---|-------------|------|--------------------|-------|
| 1 | Medical Doctor | `222` | Medical doctors | FACT (كود أصلي) |
| 2 | Nurse | `223` | Nursing and midwifery professionals | FACT (كود أصلي) |
| 3 | Allied Health Professional | `322` | Modern health associate professionals (except nursing) | FACT (كود أصلي) |
| 4 | Non-Health Professional | `241` | Professionals, not health | FACT (كود أصلي) |
| 5 | Non-Health Support Staff | `411` | Support staff, not health-related | FACT (كود أصلي) |
| 6 | Pharmacist | `PHA` | Dispenses drugs. | FACT / DERIVED (كان `code = NULL`) |

> الصف `Pharmacist` هو الوحيد الذي كان كوده `NULL` في القديم؛ اشتُق `PHA` من الاسم.
> جميع الأوصاف هنا إنجليزية أصلية (لا ترجمة) لأنها كانت موجودة فعلاً في القديم.

## 4. `position_types` — 4 صفوف

المصدر: `DB export.sql` السطور **55315–55319** (`hippo_position_type`).

| # | name (FACT) | code (DERIVED) | description (ترجمة) | الثقة |
|---|-------------|----------------|----------------------|-------|
| 1 | Permanent Full-Time | `PT-PERM-FT` | دائم بدوام كامل | FACT / DERIVED |
| 2 | Permanent Part-Time | `PT-PERM-PT` | دائم بدوام جزئي | FACT / DERIVED |
| 3 | Temporary Hourly | `PT-TEMP-HR` | مؤقت بالساعة | FACT / DERIVED |
| 4 | Consultant | `PT-CONS` | استشاري | FACT / DERIVED |

> الجدول موجود في المخطط الحديث باسم `JobType`/`position_types` — تم **توسيعه**
> بالأعمدة `code`/`description`/`version`، لا إنشاؤه.

## 5. `salary_sources` — 7 صفوف

المصدر: `DB export.sql` السطور **56448–56455** (`hippo_salary_source`).

| # | name (FACT) | code (DERIVED) | description (ترجمة) | الثقة |
|---|-------------|----------------|----------------------|-------|
| 1 | Private Non-profit (NGO) | `SRC-NGO` | منظمة غير ربحية خاصة | FACT / DERIVED |
| 2 | Private For-profit (Commercial) | `SRC-COMM` | قطاع خاص تجاري | FACT / DERIVED |
| 3 | Individual Donor | `SRC-IND` | متبرع فردي | FACT / DERIVED |
| 4 | Faith-based Organization (FBO) | `SRC-FBO` | منظمة دينية | FACT / DERIVED |
| 5 | Association | `SRC-ASSOC` | جمعية | FACT / DERIVED |
| 6 | Ministry of Health | `SRC-MOH` | وزارة الصحة | FACT / DERIVED |
| 7 | Private | `SRC-PRIV` | قطاع خاص | FACT / DERIVED |

> `salary_sources` جدول **جديد** في المخطط الحديث (لم يكن موجوداً). منذ Sprint 6
> يرتبط به `positions.sourceId` (FK، migration 013، `ON DELETE RESTRICT`)؛
> يبقى العمود النصي `positions.source` للتوافق مع البيانات القديمة.

---

## 6. Seed التدريب — 16 صفاً (Sprint 6 — migration 014)

المصدر: `DB export.sql` قسم `ihris_manage` (السطور 54186–56716).
التفاصيل الكاملة في `gaps/GAP-H-001/analysis.md` §2.

| الجدول | الصفوف | المصدر | الثقة |
|--------|--------|--------|-------|
| `training_institutions` | 3 | 56713–56716 | FACT |
| `training_course_statuses` | 2 | 56662–56664 | FACT |
| `training_course_categories` | 5 | 56559–56564 | FACT |
| `training_courses` | 3 | 56535–56538 | FACT |
| `scheduled_training_courses` | 3 | 56484–56487 | FACT (الحالة `scheduled` = DERIVED) |
| `person_scheduled_training_courses` | 2 (مؤجّلان) | 54205–54207 | FACT مشروط |
| **الإجمالي المُطبَّق** | **16** | — | — |

### الأسماء الأصلية (FACT)

- **المؤسسات:** Baisl School، Caecheaje School، Caifrael School.
- **الحالات:** Open، Closed.
- **التصنيفات:** HIV/AIDS، Maternal Health، Infection Control، Neonatal Care، Laboratory.
- **الدورات:** HIV/AIDS Counseling، HIV/AIDS Patient Counseling، Postnatal Care for Nurses.
- **الدورات المجدولة:** Capital City University (×2)، Baisl School (×1).

### قواعد إضافية خاصة بالتدريب

1. المعرّفات القديمة محفوظة صريحة (15401، 15375، 15377…) لتبقى العلاقات صحيحة،
   ثم `setval` لكل sequence بعد الإدراج.
2. `scheduled_training_courses.status` عمود جديد؛ القيمة `'scheduled'` **DERIVED**
   من وثائق القديم (BR-075..078) لأن القديم لا يخزّن حالة على مستوى الدورة المجدولة.
3. `countryId`/`districtId` (9/41/55) محفوظة كأرقام قديمة — لا FK للجغرافيا في النموذج.
4. صفّا التسجيل `15384`/`15393` يشيران إلى الشخصين `10341`/`15385` غير الموجودين
   في `people` الحديثة (0 صف)، لذا يُدرجان فقط داخل `SELECT ... WHERE EXISTS`.
   في قاعدة الاختبار لم يُدرجا → `person_scheduled_training_courses = 0`.
5. لا `UPDATE` لأي صف موجود؛ `ON CONFLICT (id) DO NOTHING`.
6. الـRollback يحذف بالمعرّفات القديمة فقط (لا `TRUNCATE`).

> **لا صفوف ESTIMATE** في التدريب أيضاً: كل اسم/تاريخ/رقم منقول حرفياً.

---

## الإجمالي

| الجدول | الصفوف | FACT | DERIVED (أكواد) | ESTIMATE |
|--------|--------|------|------------------|----------|
| `salary_grades` | 5 | 5 | 5 | 0 |
| `cadres` | 4 | 4 | 4 | 0 |
| `classifications` | 6 | 6 | 1 (`PHA`)؛ 5 أصلية | 0 |
| `position_types` | 4 | 4 | 4 | 0 |
| `salary_sources` | 7 | 7 | 7 | 0 |
| `training_institutions` | 3 | 3 | 0 | 0 |
| `training_course_statuses` | 2 | 2 | 0 | 0 |
| `training_course_categories` | 5 | 5 | 0 | 0 |
| `training_courses` | 3 | 3 | 0 | 0 |
| `scheduled_training_courses` | 3 | 3 | 3 (status) | 0 |
| `person_scheduled_training_courses` | 0 (مؤجّل) | 0 | 0 | 0 |
| **المجموع** | **42** | **42** | **24** | **0** |

> Sprint 5: 26 صفاً مرجعياً. Sprint 6: 16 صفاً تدريبياً. الإجمالي المطبَّق = **42 صفاً**،
> كلها `FACT` (مع `DERIVED` للأكواد والحالة فقط)، و`ESTIMATE = 0`.

> الأكواد الأصلية في `classifications` (222/223/322/241/411) ليست مشتقة — 5 صفوف.
> لذلك مجموع الأكواد المشتقة = 26 − 5 = 21 بند `DERIVED`.

---

## التحقق بعد التطبيق

```sql
SELECT (SELECT count(*) FROM salary_grades)   AS sg,
       (SELECT count(*) FROM cadres)          AS ca,
       (SELECT count(*) FROM classifications) AS cl,
       (SELECT count(*) FROM position_types)  AS pt,
       (SELECT count(*) FROM salary_sources)  AS ss;
-- المتوقع: 5 | 4 | 6 | 4 | 7

SELECT (SELECT count(*) FROM training_institutions)              AS inst,
       (SELECT count(*) FROM training_course_statuses)           AS statuses,
       (SELECT count(*) FROM training_course_categories)         AS categories,
       (SELECT count(*) FROM training_courses)                   AS courses,
       (SELECT count(*) FROM scheduled_training_courses)         AS scheduled,
       (SELECT count(*) FROM person_scheduled_training_courses)  AS enrollments;
-- المتوقع: 3 | 2 | 5 | 3 | 3 | 0
```

إعادة التطبيق تُنتج `INSERT 0 0` لكل جدول (idempotent).

# توثيق بيانات الـSeed المرجعية — Sprint 5 (ADR-008 §8.3)

> الملف المرتبط: `migrations/pending/010_seed_reference_data.sql`
> التراجع: `migrations/rollback/010_seed_reference_data_rollback.sql`
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

> `salary_sources` جدول **جديد** في المخطط الحديث (لم يكن موجوداً). لا FK له مع
> `positions.source` (نص حر في القديم والحديث) — انظر ADR-008 §8.5.

---

## الإجمالي

| الجدول | الصفوف | FACT | DERIVED (أكواد) | ESTIMATE |
|--------|--------|------|------------------|----------|
| `salary_grades` | 5 | 5 | 5 | 0 |
| `cadres` | 4 | 4 | 4 | 0 |
| `classifications` | 6 | 6 | 1 (`PHA`)؛ 5 أصلية | 0 |
| `position_types` | 4 | 4 | 4 | 0 |
| `salary_sources` | 7 | 7 | 7 | 0 |
| **المجموع** | **26** | **26** | **21** | **0** |

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
```

إعادة التطبيق تُنتج `INSERT 0 0` لكل جدول (idempotent).

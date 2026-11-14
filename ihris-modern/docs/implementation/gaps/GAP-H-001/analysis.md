# GAP-H-001 — إضافة دورة مجدولة (Scheduled Training Course)

> Sprint 6 / ADR-009. تحليل مبني على `DB export.sql` (FACT) و`04-OLD-BUSINESS-RULES.md`.

## 1. الوضع الحالي في API/UI

| الطبقة | الموجود | الناقص |
|--------|---------|--------|
| Prisma | `ScheduledTrainingCourse` + `PersonScheduledTraining` (schema 741–831) | `version`، `status` |
| Service | `training.service.ts`: قائمة/إنشاء دورات + مؤسسات + حالات + تصنيفات | لا CRUD للدورات المجدولة ولا التسجيل |
| Routes | `GET/POST /training/courses`، `GET/POST /training/institutions`، `GET /statuses`، `GET /categories` | لا مسارات للدورات المجدولة |
| UI | `Training.tsx` قراءة فقط + زر «دورة جديدة» يعرض `alert` | لا نموذج للدورة المجدولة |
| Audit | لا يوجد | `training_audit_log` غير موجود |

## 2. البيانات الفعلية في `DB export.sql` (FACT)

الكتل المستخرجة من القسم الخاص بـ`ihris_manage` (السطور 54186–56716):

### `hippo_training_institution` — 3 صفوف
| id | name | country | district |
|----|------|---------|----------|
| 15401 | Baisl School | 9 | 55 |
| 15403 | Caecheaje School | 9 | 82 |
| 15405 | Caifrael School | 9 | 41 |

### `hippo_training_course_status` — 2 صفوف
| id | name |
|----|------|
| 15375 | Open |
| 15376 | Closed |

### `hippo_training_course_category` — 5 صفوف
| id | name |
|----|------|
| 15374 | HIV/AIDS |
| 15417 | Maternal Health |
| 15420 | Infection Control |
| 15421 | Neonatal Care |
| 15422 | Laboratory |

### `hippo_training_funder` — 1 صف
| id | name |
|----|------|
| 15407 | Capacity Project/IntraHealth |

### `hippo_training_course` — 3 صفوف
| id | name | topic | institution | funder | CE course | status | category | competency |
|----|------|-------|-------------|--------|-----------|--------|----------|------------|
| 15377 | HIV/AIDS Counseling | Counseling | NULL | NULL | NULL | 15375 | 15374 | 163 |
| 15414 | HIV/AIDS Patient Counseling | Counseling | 15403 | 15407 | 15400 | 15375 | 15374 | NULL |
| 15418 | Postnatal Care for Nurses | Postnatal Care | 15401 | 15407 | 15416 | 15375 | 15417 | 174 |

### `hippo_scheduled_training_course` — 3 صفوف
| id | training_course | site | students | start | end | country | district | instructors |
|----|-----------------|------|----------|-------|-----|---------|----------|-------------|
| 15378 | 15377 | Capital City University | 15 | 2008-08-14 | 2008-08-17 | 9 | 41 | NULL |
| 15415 | 15414 | Capital City University | 50 | 2008-12-17 | 2008-12-20 | 9 | 41 | NULL |
| 15419 | 15418 | Baisl School | 65 | 2009-04-10 | 2009-04-17 | 9 | 55 | Ms. Janine Brown |

### `hippo_person_scheduled_training_course` — 2 صفوف
| id | person | scheduled | completed | request_date | evaluation |
|----|--------|-----------|-----------|--------------|------------|
| 15384 | 10341 | 15378 | 0 | 2008-08-14 | 15381 (Incomplete) |
| 15393 | 15385 | 15378 | 0 | 2008-08-14 | 15381 (Incomplete) |

### جداول مرجعية مساندة (لا نماذج حديثة لها)
- `hippo_training_course_evaluation`: Pass / Fail / Incomplete (3).
- `hippo_training_course_requestor`: Employee / Supervisor / Human Resources / Donor / Other (5).

**إجمالي صفوف التدريب القابلة للـSeed في النماذج الحديثة: 16 صفاً**
(3 مؤسسات + 2 حالات + 5 تصنيفات + 3 دورات + 3 دورات مجدولة).
صفّا التسجيل (15384/15393) **مؤجّلان** لأن الشخصين 10341/15385 غير موجودين في
`people` الحديثة (0 صف)؛ يُدرجان بشرط `EXISTS` عند ترحيل الأشخاص لاحقاً.

## 3. العلاقات (BR-053..058)

```
training_institutions 1 ─── * training_courses
training_course_statuses 1 ─── * training_courses
training_course_categories 1 ─── * training_courses
training_courses 1 ─── * scheduled_training_courses   (ON DELETE CASCADE)
scheduled_training_courses 1 ─── * person_scheduled_training_courses (CASCADE)
people 1 ─── * person_scheduled_training_courses       (CASCADE)
```

## 4. حالات الدورة القديمة (BR-075..078 / BR-088 / BR-090)

آلة الحالة في `05-OLD-WORKFLOWS.md`: `Planning → Scheduled → Completed / Cancelled`
مع السماح `Scheduled → Planning`، والإلغاء مسموح من `Scheduled` و`Planning`.
`BR-090` يثبت الإتمام على مستوى التسجيل عبر `person_scheduled_training_course.completed`.

> **تعارض موثّق:** جدول الحالات الفعلي يحوي `Open`/`Closed` فقط، بينما الوثائق
> تصف 4 حالات. الحل في ADR-009: تبقى `training_course_statuses` مرجعاً واقعياً
> (FACT: Open/Closed)، وتُضاف حالة سير عمل مستقلة `scheduled_training_courses.status`
> بالقيم `planning|scheduled|completed|cancelled` المشتقة من الوثائق (DERIVED).

## 5. قرار التنفيذ (ملخّص)

1. Migration 011: `version` + `deletedAt` للدورات، `version` + `status` للدورات المجدولة،
   فهارس، وقيود FK صريحة.
2. Migration 012: `training_audit_log` موحّد (entityType/entityId/action/changedBy/old/new).
3. Migration 013: `positions.sourceId` FK → `salary_sources(id)` مع `ON DELETE RESTRICT`.
4. Migration 014: Seed التدريب (16 صفاً) + محاولة conditional للتسجيلات.
5. CRUD كامل + تسجيل متدربين + قائمة متدربين + منع حذف المرتبط (422).

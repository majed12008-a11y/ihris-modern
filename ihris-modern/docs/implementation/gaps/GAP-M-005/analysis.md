# تحليل GAP-M-005/006/007 — إدارة المسميات الوظيفية (Job Titles)

> التاريخ: 08 نوفمبر 2026 — قبل التنفيذ.

## 1. الحالة الفعلية قبل التنفيذ

| البند | الحالة |
|-------|--------|
| `services/job.service.ts` | ❌ غير موجود |
| `routes/job.ts` / `controllers/job.controller.ts` | ❌ غير موجود |
| `pages/Jobs.tsx` | ❌ غير موجود |
| API للمسميات | ❌ لا يوجد مسار مستقل |
| استعمال `Job` | يُقرأ فقط داخل `PositionForm`/`Positions` (عرض/اختيار) |

## 2. بنية `jobs` الحديثة

| العمود | النوع | قيود |
|--------|-------|------|
| `id` | serial | PK |
| `title` | varchar(255) | NOT NULL (بلا UNIQUE في DB) |
| `code` | varchar(50) | NULLABLE (بلا UNIQUE) |
| `description` | text | NULLABLE |
| `salaryGradeId` | int | FK → `salary_grades.id` (SET NULL) |
| `cadreId` | int | FK → `cadres.id` (SET NULL) |
| `classificationId` | int | FK → `classifications.id` (SET NULL) |
| `version` | — | **غير موجود** (يُضاف في migration 007) |

## 3. النظام القديم

- `hippo_job`: `title`, `code`, `description`, `salary_grade`, `cadre`, `classification` (02-OLD-DATA-DICTIONARY §3.3).
- BR-044/045/046: علاقات `hippo_job` بـ`hippo_salary_grade` و`hippo_cadre` و`hippo_classification`.
- **لا UNIQUE على `code` في القديم** → لا نفرض تفرّد الكود، بل تفرّد `title`
  (لأن سيناريو القبول 9 يطلب 409 عند تكرار المسمى).
- لا قاعدة قديمة تحدد حذف مسمى مستخدم → القرار في ADR-007: يُرفض 422 إن كان مرتبطاً بوظائف شاغرة.

## 4. المراجع الفعلية للمسمى في `ihris_test_gap001`

| الجدول | العمود | سلوك FK |
|--------|--------|----------|
| `positions` | `jobId` | SET NULL |

> `SET NULL` يعني أن حذف مسمى مستخدم يُفرّغ `positions.jobId` صامتاً — وهو سلوك غير مقبول.
> الحماية على مستوى التطبيق: عدّ `positions` أولاً → 422.

## 5. البيانات المرجعية للـcascade

| الجدول | العدد الحالي | المصدر |
|--------|--------------|--------|
| `salary_grades` | 0 | `GET /api/jobs/meta/salary-grades` |
| `cadres` | 0 | `GET /api/jobs/meta/cadres` |
| `classifications` | 0 | `GET /api/jobs/meta/classifications` |

> الجداول فارغة حالياً؛ الاختبارات تُنشئ صفوفاً ببادئة `gap4` وتنظّفها.

## 6. المطلوب

1. `GET/POST/PUT/DELETE /api/jobs` + pagination (20) + بحث بالاسم/الكود.
2. `GET /api/jobs/meta/{salary-grades,cadres,classifications}` لبناء cascade.
3. Zod `.strict()` + تحقق وجود المراجع.
4. قفل تفاؤلي عبر `version` (409).
5. Audit في `job_audit_log`.
6. حماية حذف: 422 إن كان للمسمى وظائف شاغرة.
7. منع تكرار العنوان (case-insensitive) → 409.
8. الأدوار: admin + hr_manager كتابة، hr_staff قراءة، الحذف admin فقط.

## 7. خارج النطاق

- GAP-M-004 (عرض تفاصيل وظيفة) — اختياري، لم يُنفَّذ في هذا السبرنت (موثّق في `05-BLOCKERS.md`).
- إدارة `salary_grades`/`cadres`/`classifications` نفسها (فجوات مرجعية أخرى).

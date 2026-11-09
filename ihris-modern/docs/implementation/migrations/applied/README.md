# سكريبتات الترحيل المنفذة (Applied Migrations)

تحتوي هذه المجلد على سجلات سكريبتات الترحيل التي تم تنفيذها.

| الملف | التاريخ | البيئة | المسؤول | الحالة |
|-------|---------|--------|---------|---------|
| `001_create_report_tables.sql` | 2026-11-05 | **ihris_test_gap001** فقط (قاعدة اختبار منفصلة) | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق |
| `002_user_soft_delete_and_audit.sql` | 2026-11-05 | **ihris_test_gap001** فقط (قاعدة اختبار منفصلة) | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `003_user_active_flag.sql` | 2026-11-06 | **ihris_test_gap001** فقط | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `004_user_token_version.sql` | 2026-11-06 | **ihris_test_gap001** فقط | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `005_facility_version_and_audit.sql` | 2026-11-06 | **ihris_test_gap001** فقط | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `006_country_version_and_audit.sql` | 2026-11-08 | **ihris_test_gap001** فقط | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `007_job_version_and_audit.sql` | 2026-11-08 | **ihris_test_gap001** فقط | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `008_reference_data_schema.sql` | 2026-11-08 | **ihris_test_gap001** فقط | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `009_reference_data_audit.sql` | 2026-11-08 | **ihris_test_gap001** فقط | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |
| `010_seed_reference_data.sql` | 2026-11-08 | **ihris_test_gap001** فقط (تطوير/اختبار) | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق (idempotent + rollback مُختبَر) |

> **Note: `ihris_test_gap001` retained for human review as of 2026-11-08.**
> لا تُحذف قاعدة الاختبار؛ تُترك للمراجعة البشرية ولإعادة تشغيل اختبارات
> GAP-002/GAP-003 وSprint 2.5 وGAP-004/005/006 وSprint 4 (GAP-M-005..010)
> وSprint 5 (البيانات المرجعية + Seed).

## تفاصيل التنفيذ

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` (منفصلة تماماً عن `ihris_manage`) |
| النسخة الاحتياطية قبل التطبيق | `docs/implementation/backups/ihris_manage_pre-gap001-20261105-201854.dump` (pg_dump -Fc) |
| أساس القاعدة | استُعيدت نسخة `ihris_manage` داخل `ihris_test_gap001` ثم طُبّق الترحيل |
| سبب التطبيق | تشغيل اختبار التكامل الحقيقي `report.test.ts` (إغلاق بوابة Sprint 1.5) |
| أمر التطبيق | `psql -d ihris_test_gap001 -v ON_ERROR_STOP=1 -f pending/001_create_report_tables.sql` |
| التحقق | `to_regclass` يعيد الجداول الثلاثة |
| Idempotency | أُعيد التطبيق مرة ثانية: NOTICE فقط، بلا أخطاء |
| Rollback | نُفِّذ `rollback/001_create_report_tables_rollback.sql` بنجاح على نفس القاعدة قبل إعادة التطبيق |
| **قاعدة الإنتاج `ihris_manage`** | ❌ **لم تُمسّ** |

## تفاصيل ترحيل 002 (GAP-002/GAP-003)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `users.version/deletedAt/deletedBy/deletionReason/restoredAt` + فهرس + `user_audit_log` + 3 فهارس + CHECK |
| Idempotency | ✅ تطبيق ثانٍ: NOTICE فقط |
| Rollback | ✅ `rollback/002_user_soft_delete_and_audit_rollback.sql` نُفِّذ ثم أُعيد التطبيق |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** — لم يُطبَّق على أي بيئة إنتاج |

## تفاصيل ترحيل 003 (BLK-008)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `users.isActive BOOLEAN NOT NULL DEFAULT true` + فهرس `(isActive, deletedAt)` + توسيع CHECK لـ`deactivate`/`activate` |
| Idempotency | ✅ تطبيق ثانٍ: NOTICE فقط |
| Rollback | ✅ `rollback/003_user_active_flag_rollback.sql` (يعيد CHECK بـ`NOT VALID` حفاظاً على سجل التدقيق) |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** |

> **تنويه احتفاظ:** لا يُحذف `user_audit_log` عند التراجع، حتى لو رجع CHECK إلى قيمه القديمة.

## تفاصيل ترحيل 004 (ADR-005)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `users.tokenVersion INTEGER NOT NULL DEFAULT 1` |
| Idempotency | ✅ تطبيق ثانٍ: NOTICE فقط |
| Rollback | ✅ `rollback/004_user_token_version_rollback.sql` |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** |

## تفاصيل ترحيل 005 (GAP-004/005/006)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `facilities.version INTEGER NOT NULL DEFAULT 1` + `facility_audit_log` + 3 فهارس |
| Idempotency | ✅ تطبيق ثانٍ: NOTICE فقط |
| Rollback | ✅ `rollback/005_facility_version_and_audit_rollback.sql` |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** |

> **تنويه احتفاظ:** `facility_audit_log` بلا FK إلى `facilities` عمداً، ليبقى سجل التدقيق
> بعد الحذف الفيزيائي للمنشأة.

## تفاصيل ترحيل 006 (GAP-M-008/009/010 — الدول)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `countries.version INTEGER NOT NULL DEFAULT 1` + `country_audit_log` + 3 فهارس |
| Idempotency | ✅ تطبيق ثانٍ: NOTICE فقط |
| Rollback | ✅ `rollback/006_country_version_and_audit_rollback.sql` |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** |

> **تنويه احتفاظ:** `country_audit_log` بلا FK إلى `countries` عمداً، ليبقى سجل التدقيق
> بعد الحذف الفيزيائي للدولة.

> **تنويه ترقيم:** رُقّم هذا الترحيل `006` بعد أن أُغلق BLK-010 («لا عمود `code` في
> `hippo_facility`»)، فلم تعد هناك حاجة لترحيل كود المنشأة المقترح سابقاً بالرقم 006.

## تفاصيل ترحيل 007 (GAP-M-005/006/007 — المسميات الوظيفية)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `jobs.version INTEGER NOT NULL DEFAULT 1` + `job_audit_log` + 3 فهارس + `idx_jobs_title` + `idx_jobs_code` |
| Idempotency | ✅ تطبيق ثانٍ: NOTICE فقط |
| Rollback | ✅ `rollback/007_job_version_and_audit_rollback.sql` |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** |

> **تنويه احتفاظ:** `job_audit_log` بلا FK إلى `jobs` عمداً، ليبقى سجل التدقيق بعد الحذف
> الفيزيائي للمسمى. تفرّد `jobs.title` يُفرض تطبيقياً لا بـUNIQUE في DB (مطابقة للقديم).

## تفاصيل ترحيل 008 (Sprint 5 — مخطط البيانات المرجعية)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `salary_grades` (+`code`,`description`,`startSalary`,`endSalary`,`midpointSalary`,`notes`,`version`) + `cadres` (+`code`,`description`,`version`) + `classifications` (+`version`) + `position_types` (+`code`,`description`,`version`) + جدول `salary_sources` كامل + فهارس فريدة على `code` |
| Idempotency | ✅ تطبيق ثانٍ: NOTICE فقط |
| Rollback | ✅ `rollback/008_reference_data_schema_rollback.sql` (يحذف `salary_sources` والأعمدة/الفهارس المضافة) |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** |

## تفاصيل ترحيل 009 (Sprint 5 — التدقيق الموحّد)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط |
| المحتوى | `reference_data_audit_log` (entityType/entityId/action/changedBy/changedAt/oldValues/newValues/reason) + CHECK للـaction والكيان + 3 فهارس |
| Idempotency | ✅ تطبيق ثانٍ: `DO` + NOTICE فقط |
| Rollback | ✅ `rollback/009_reference_data_audit_rollback.sql` |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending** |

> **تنويه احتفاظ:** `reference_data_audit_log` بلا FK عمداً، ليبقى السجل بعد الحذف الفيزيائي.

## تفاصيل ترحيل 010 (Sprint 5 — Seed)

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` فقط — **لا يُطبَّق تلقائياً في الإنتاج** |
| المحتوى | 26 صفاً FACT من `DB export.sql` (`ihris_manage`): 5 درجات + 4 فئات + 6 تصنيفات + 4 أنواع + 7 مصادر |
| Idempotency | ✅ `ON CONFLICT (code) DO NOTHING` → `INSERT 0 0` عند الإعادة |
| Rollback | ✅ `rollback/010_seed_reference_data_rollback.sql` — `DELETE WHERE code IN (...)` فقط |
| التوثيق صفاً بصف | `migrations/seeds/README.md` (المصدر/السطر/مستوى الثقة) |
| الإنتاج `ihris_manage` | ❌ لم تُمسّ |
| الحالة في الإنتاج | ⏳ **pending — قرار يدوي بقاعدة منفصلة** |

> **لا يُدمج 010 مع 008/009**، ولا يُنفَّذ تلقائياً عند النشر. Seed الإنتاج يحتاج قراراً بشرياً.

## ملاحظة تصحيحية مهمة

النسخة الأولى من الترحيل استخدمت أعمدة snake_case (`is_enabled`, `created_by`, ...)
بينما مخطط Prisma يتوقع camelCase (`isEnabled`, `createdBy`, ...) لأن الجداول الحالية
تستخدم camelCase (`users.createdAt`, `users.creatorId`). لذلك فشل أول تشغيل لاختبار
التكامل بخطأ `P2022: column isEnabled does not exist`. صُحِّح الترحيل وأُعيد تطبيقه.

## تعليمات الاستخدام

1. بعد تنفيذ سكريبت ترحيل بنجاح، سجّله في الجدول أعلاه مع البيئة والتاريخ.
2. لا تنقل الملف من `pending` قبل التأكد من التطبيق على البيئة المستهدفة.

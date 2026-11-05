# سكريبتات الترحيل المنفذة (Applied Migrations)

تحتوي هذه المجلد على سجلات سكريبتات الترحيل التي تم تنفيذها.

| الملف | التاريخ | البيئة | المسؤول | الحالة |
|-------|---------|--------|---------|---------|
| `001_create_report_tables.sql` | 2026-11-05 | **ihris_test_gap001** فقط (قاعدة اختبار منفصلة) | Lead Implementation Engineer | ✅ مطبَّق ومُتحقَّق |

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

## ملاحظة تصحيحية مهمة

النسخة الأولى من الترحيل استخدمت أعمدة snake_case (`is_enabled`, `created_by`, ...)
بينما مخطط Prisma يتوقع camelCase (`isEnabled`, `createdBy`, ...) لأن الجداول الحالية
تستخدم camelCase (`users.createdAt`, `users.creatorId`). لذلك فشل أول تشغيل لاختبار
التكامل بخطأ `P2022: column isEnabled does not exist`. صُحِّح الترحيل وأُعيد تطبيقه.

## تعليمات الاستخدام

1. بعد تنفيذ سكريبت ترحيل بنجاح، سجّله في الجدول أعلاه مع البيئة والتاريخ.
2. لا تنقل الملف من `pending` قبل التأكد من التطبيق على البيئة المستهدفة.

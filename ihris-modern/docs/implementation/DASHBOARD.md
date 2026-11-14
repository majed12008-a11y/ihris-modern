# لوحة التحكم — Sprint 0 / 1 / 1.5 / 2 / 2.5 / 3 / 4 / 5 / 5.5 / 6

## ملخص التنفيذ

| البند | القيمة |
|-------|--------|
| التاريخ | 14 نوفمبر 2026 |
| reviewer | Lead Implementation Engineer |
| حالة Sprint 0 | ✅ مكتمل (شجرة التتبع) |
| حالة Sprint 1 | ✅ مكتمل — GAP-001 مغلقة |
| حالة Sprint 1.5b | ✅ مكتمل — إصلاح البنية |
| حالة Sprint 1.5c | ✅ مكتمل — محرك تقارير حقيقي |
| حالة Sprint 2 | ✅ مكتمل — GAP-002 + GAP-003 مغلقتان |
| حالة Sprint 2.5 | ✅ **مكتمل — BLK-008 مغلق + ADR-005 منفّذ + GAP-L-002/003 مُصنَّفتان** |
| حالة Sprint 3 | ✅ **مكتمل — GAP-004 + GAP-005 + GAP-006 مغلقة** |
| حالة Sprint 4 | ✅ **مكتمل — GAP-M-005/006/007/008/009/010 مغلقة + BLK-009/BLK-010 مغلقان** |
| حالة Sprint 5 | ✅ **مكتمل — GAP-FE-010/011/012 + GAP-M-004/012/013/014/015 مغلقة + BLK-011 مغلق** |
| حالة Sprint 5.5 | ✅ **معتمد — عزل الاختبارات + Transaction wrapper + 6 حواجز preflight** |
| حالة Sprint 6 | ✅ **مكتمل — GAP-FE-007/008/009 + GAP-H-001/002 مغلقة + Polish + tech debt (`positions.sourceId`)** |

## إحصاءات التقدم (على 48 فجوة كانونية)

| البند | القيمة | المصدر |
|-------|--------|---------|
| عدد الفجوات الكانوني | **48** | `CORRECTED-GAP-REGISTRY.md` |
| الرقم الإداري | 22 | قرار بشري (لا يُعاد فتحه) |
| الفجوات المغلقة كلياً | **26** | `gaps/*/verification.md` |
| الفجوات المغلقة جزئياً | **1** (GAP-L-002 — 55%، P2) | `CORRECTED-GAP-REGISTRY.md` |
| الفجوات المتبقية | **21** | `CORRECTED-GAP-REGISTRY.md` |
| نسبة الإغلاق | 26/48 = **54.17%** | حساب مباشر |

> **تتبّع التقدم:** 13 (نهاية Sprint 4) → 21 (Sprint 5) → **26 (Sprint 6: خمس فجوات تدريبية)**.
> كل فجوة من الخمس لها 18 سيناريو قبول + 10 أمان + اختبارات وحدة وأدلة تنفيذ.

## الفجوات المغلقة (26)

| # | المعرف | العنوان | المجال | الحالة |
|---|-------|---------|--------|---------|
| 1 | GAP-001 | إنشاء تقرير مخصص | إدارة التقارير | ✅ مكتملة |
| 2 | GAP-002 | تعديل مستخدم | إدارة المستخدمين | ✅ مكتملة |
| 3 | GAP-003 | حذف مستخدم | إدارة المستخدمين | ✅ مكتملة |
| 4 | GAP-004 | إضافة منشأة | إدارة المنشآت | ✅ مكتملة |
| 5 | GAP-005 | تعديل منشأة | إدارة المنشآت | ✅ مكتملة |
| 6 | GAP-006 | عرض منشأة | إدارة المنشآت | ✅ مكتملة |
| 7 | GAP-L-003 | تتبع استخدام التقارير | إدارة التقارير | ✅ مكتملة |
| 8 | GAP-M-008 | إضافة دولة | إدارة المراجع | ✅ مكتملة (Sprint 4) |
| 9 | GAP-M-009 | تعديل دولة | إدارة المراجع | ✅ مكتملة (Sprint 4) |
| 10 | GAP-M-010 | حذف دولة | إدارة المراجع | ✅ مكتملة (Sprint 4) |
| 11 | GAP-M-005 | إضافة مسمى وظيفي | إدارة الوظائف | ✅ مكتملة (Sprint 4) |
| 12 | GAP-M-006 | تعديل مسمى وظيفي | إدارة الوظائف | ✅ مكتملة (Sprint 4) |
| 13 | GAP-M-007 | حذف مسمى وظيفي | إدارة الوظائف | ✅ مكتملة (Sprint 4) |
| 14 | GAP-FE-010 | إضافة درجة راتب | إدارة الرواتب | ✅ مكتملة (Sprint 5) |
| 15 | GAP-FE-011 | تعديل درجة راتب | إدارة الرواتب | ✅ مكتملة (Sprint 5) |
| 16 | GAP-FE-012 | حذف درجة راتب | إدارة الرواتب | ✅ مكتملة (Sprint 5) |
| 17 | GAP-M-012 | إدارة الفئات الوظيفية (Cadre CRUD) | إدارة الوظائف | ✅ مكتملة (Sprint 5) |
| 18 | GAP-M-013 | إدارة التصنيفات الوظيفية | إدارة الوظائف | ✅ مكتملة (Sprint 5) |
| 19 | GAP-M-014 | إدارة أنواع الوظائف | إدارة الوظائف | ✅ مكتملة (Sprint 5) |
| 20 | GAP-M-015 | إدارة مصادر الرواتب | إدارة الوظائف | ✅ مكتملة (Sprint 5) |
| 21 | GAP-M-004 | عرض تفاصيل وظيفة | إدارة الوظائف | ✅ مكتملة (Sprint 5) |
| 22 | GAP-007 / GAP-FE-007 | تعديل دورة تدريبية | إدارة التدريب | ✅ مكتملة (Sprint 6) |
| 23 | GAP-FE-008 | حذف دورة تدريبية (ناعم) | إدارة التدريب | ✅ مكتملة (Sprint 6) |
| 24 | GAP-FE-009 | إضافة مؤسسة تدريبية | إدارة التدريب | ✅ مكتملة (Sprint 6) |
| 25 | GAP-H-001 | إضافة دورة مجدولة | إدارة التدريب | ✅ مكتملة (Sprint 6) |
| 26 | GAP-H-002 | عرض المتدربين | إدارة التدريب | ✅ مكتملة (Sprint 6) |

## حالة الأدلة (فعلية)

| البند | القيمة |
|-------|--------|
| Backend tests | **227 / 227** (27 suites) |
| Frontend tests | **7 / 7** (2 suites) |
| TypeScript | backend ✅ / frontend ✅ |
| اختبارات Sprint 2.5 (BLK-008 + ADR-005) | **11/11** |
| اختبارات Sprint 3 (قبول) | **10/10** |
| اختبارات أمان Sprint 3 | **8/8** |
| اختبارات وحدة Zod للمنشآت | **6/6** |
| اختبارات Sprint 4 (قبول) | **12/12** |
| اختبارات أمان Sprint 4 | **8/8** |
| اختبارات وحدة Zod (دول + مسميات) | **8/8** |
| اختبارات Sprint 5 (قبول CRUD + E2E/Seed) | **22/22** |
| اختبارات أمان Sprint 5 | **10/10** |
| اختبارات تكميلية Sprint 5 | **11/11** |
| اختبارات وحدة Zod للبيانات المرجعية | **12/12** |
| اختبارات Sprint 6 (قبول التدريب) | **17/17** |
| اختبارات أمان Sprint 6 | **10/10** |
| اختبارات وحدة Zod للتدريب | **6/6** |
| اختبار واجهة التنقّل المجمّع (سيناريو 18) | **4/4** |
| Regression | ✅ 194 + 33 = **227/227** (backend) + **7/7** (frontend) |
| قاعدة الاختبار | `ihris_test_gap001` — 26 صفاً مرجعياً + 16 صف تدريب seeded |

## حالة Sprint 4

| البند | الحالة | الدليل |
|-------|--------|--------|
| GAP-M-008 (إضافة دولة) | ✅ مكتملة | `country.test.ts` 1 |
| GAP-M-009 (تعديل دولة) | ✅ مكتملة | `country.test.ts` 4 |
| GAP-M-010 (حذف دولة) | ✅ مكتملة | `country.test.ts` 5–6 |
| GAP-M-005 (إضافة مسمى) | ✅ مكتملة | `job.test.ts` 7–10 |
| GAP-M-006 (تعديل مسمى) | ✅ مكتملة | `job.test.ts` 11 |
| GAP-M-007 (حذف مسمى) | ✅ مكتملة | `job.test.ts` 12 |
| ADR-007 | ✅ منفّذ | `04-DECISIONS.md` §7 |
| Migrations 006/007 | ✅ مطبَّق + rollback مُختبَر | `migrations/applied/README.md` |
| BLK-009 | ✅ مغلق — `regions` مستقلة | `05-BLOCKERS.md` |
| BLK-010 | ✅ مغلق — لا `code` في القديم | `gaps/GAP-004/analysis.md` §6 |

## حالة Sprint 5

| البند | الحالة | الدليل |
|-------|--------|--------|
| ADR-008 (10 قرارات) | ✅ موثّق قبل التنفيذ | `04-DECISIONS.md` §8 |
| Migration 008 (schema) | ✅ مطبَّق + idempotent + rollback | `migrations/pending/008_reference_data_schema.sql` |
| Migration 009 (audit) | ✅ مطبَّق + idempotent + rollback | `migrations/pending/009_reference_data_audit.sql` |
| Migration 010 (seed) | ✅ مطبَّق + `INSERT 0 0` عند الإعادة + rollback | `migrations/pending/010_seed_reference_data.sql` |
| Seed (26 صفاً FACT) | ✅ 5+4+6+4+7 | `migrations/seeds/README.md` |
| GAP-FE-010/011/012 | ✅ CRUD درجات الرواتب | `SalaryGrades.tsx` + `ReferenceDataManager.tsx` |
| GAP-M-012 (Cadres) | ✅ CRUD | `Cadres.tsx` |
| GAP-M-013 (Classifications) | ✅ CRUD | `Classifications.tsx` |
| GAP-M-014 (Position Types) | ✅ CRUD | `PositionTypes.tsx` |
| GAP-M-015 (Salary Sources) | ✅ CRUD | `SalarySources.tsx` |
| GAP-M-004 (JobDetail) | ✅ صفحة تفاصيل + مناصب مرتبطة | `JobDetail.tsx` + `GET /api/jobs/:id` |
| BLK-011 | ✅ مغلق — الجداول الخمسة مستخدمة end-to-end | `05-BLOCKERS.md` |
| E2E: job بمراجع seeded → 201 | ✅ | `reference.test.ts` 21 |
| E2E: حذف مرجع مستخدم → 422 | ✅ | `reference.test.ts` 22 |

## حالة Sprint 6

| البند | الحالة | الدليل |
|-------|--------|--------|
| ADR-009 (10 قرارات) | ✅ موثّق قبل التنفيذ | `04-DECISIONS.md` §9 |
| Migration 011 (training schema) | ✅ مطبَّق + idempotent + rollback مُختبَر | `migrations/pending/011_training_schema.sql` |
| Migration 012 (training audit) | ✅ مطبَّق + rollback مُختبَر | `migrations/pending/012_training_audit.sql` |
| Migration 013 (`positions.sourceId` FK) | ✅ مطبَّق + `ON DELETE RESTRICT` + rollback | `migrations/pending/013_positions_source_fk.sql` |
| Migration 014 (Seed تدريب) | ✅ 16 صفاً FACT + صفّا تسجيل مشروطان | `migrations/pending/014_seed_training.sql` |
| GAP-007 / GAP-FE-007 (تعديل دورة) | ✅ نموذج موحّد إنشاء/تعديل + 409 | `TrainingForm.tsx` + `PUT /api/training/courses/:id` |
| GAP-FE-008 (حذف دورة) | ✅ حذف ناعم + 422 عند وجود دورات مجدولة | `Training.tsx` + `DELETE /api/training/courses/:id` |
| GAP-FE-009 (مؤسسة تدريبية) | ✅ CRUD كامل + 422 | `TrainingInstitutions.tsx` |
| GAP-H-001 (دورة مجدولة) | ✅ إنشاء/تعديل + آلة حالة + version | `ScheduledCourseForm.tsx` |
| GAP-H-002 (المتدربون) | ✅ عرض/تسجيل/إتمام/حذف | `EnrolledStudents.tsx` |
| Polish: عرض تفاصيل 422 | ✅ `extractErrorMessages` | `lib/errorDetails.ts` |
| Polish: تجميع التنقّل | ✅ مجموعة قابلة للطي + اختبار | `MainLayout.tsx` + `MainLayout.test.tsx` |
| Tech debt: `positions.source` → FK | ✅ `sourceId` + تحديث عدّ المراجع | `013_positions_source_fk.sql` |
| أدوار الكتابة | ✅ `admin` + `hr_manager` + `training_manager`؛ `hr_staff` قراءة | `routes/training.ts` |
| Seed مؤجّل | ⚠️ صفّا التسجيل 15384/15393 (الشخصان غير موجودين) | `gaps/GAP-H-001/analysis.md` §2 |

## الملفات الرئيسية

| الملف | الحالة |
|-------|--------|
| 00-MASTER-PLAN.md | ✅ |
| 04-DECISIONS.md | ✅ ADR-002 … ADR-009 |
| 05-BLOCKERS.md | ✅ BLK-008/009/010/011 مغلقة + BLK-007 مؤجل P2 |
| 06-RISK-TRACKER.md | ✅ RISK-007/RISK-021 مغلقتان + RISK-020 جزئية |
| 07-TEST-EVIDENCE.md | ✅ 227 + 7 + 44 + 35 + 28 |
| CORRECTED-GAP-REGISTRY.md | ✅ 26/48 = 54.17% |
| gaps/GAP-004..006 + GAP-M-004/005..015 + GAP-FE-007..012 + GAP-H-001/002 | ✅ تحليل + تحقق + أدلة |
| migrations/applied/README.md | ✅ 001–014 + تنويه الاحتفاظ بالقاعدة |

## العوائق / نقاط تحتاج قرار

1. **BLK-006 — عيوب تقارير الدراسة:** 22 مقابل 31 مقابل 44، نسب 141%. عُولج بملحق تصحيحي وينتظر اطلاع الإدارة.
2. **BLK-007 — `user_log` مفقود:** مؤجل إلى P2 بقرار صريح — لم يبدأ.
3. **GAP-L-002 — Arabic PDF + Excel:** متبقيان، مؤجلان P2.
4. **Token revocation لكل جهاز:** غير مدعوم؛ ترقية Refresh Tokens في P3.
5. **~~`positions.source` نص حر~~:** ✅ **مغلق في Sprint 6** — `positions.sourceId` FK إلى `salary_sources` (Migration 013).
6. **Seed التسجيل التدريبي:** صفّا `person_scheduled_training_courses` (15384/15393) مشروطان بوجود الشخصين 10341/15385 في `people`؛ لم يُطبَّقا لأن `people` فارغ.

## الخطوة التالية المقترحة

1. اعتماد تقرير Sprint 6.
2. Sprint 7: فجوات إدارة الطلبات (`GAP-H-003..010` + `GAP-FE-013..016`) — أكبر تجمّع متبقٍ (12 فجوة).
3. أو معالجة `GAP-L-002` المتبقي (PDF عربي + Excel) إن كانت الأولوية إدارية.

---

## التحقق من القيود

| البند | الحالة | الملاحظة |
|-------|--------|---------|
| `DB export.sql` دون تعديل | ✅ | لم يُلمس؛ البيانات استُخرجت قراءةً فقط |
| قاعدة `ihris_manage` دون تعديل | ✅ | 0 أعمدة/جداول جديدة؛ الـseed على `ihris_test_gap001` فقط |
| قاعدة الاختبار لم تُحذف | ✅ | محفوظة للمراجعة البشرية |
| `docs/legacy-modern-comparison/` | ✅ | لم يُلمس في هذه الجولة |
| نطاق Sprint 6 | ✅ | 5 فجوات تدريبية + Polish + tech debt فقط |
| ADR-009 | ✅ | منفّذ بالكامل (10 قرارات) |
| Migration rollback | ✅ | 011/012/013/014 مُختبَرة (rollback ثم إعادة تطبيق) |
| Seed على الإنتاج | ✅ | لم يُطبَّق؛ 014 pending فقط |

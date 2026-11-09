# Sprint الحالي — Sprint 5 (البيانات المرجعية + Seed واقعي) — مكتمل

## معلومات Sprint

| البند | القيمة |
|-------|--------|
| الاسم | Sprint 5 — GAP-FE-010/011/012 + GAP-M-012/013/014/015 + GAP-M-004 + Seed Data |
| التاريخ | 08 نوفمبر 2026 |
| الحالة | ✅ **مكتمل — 8 فجوات مغلقة + BLK-011 مغلق** |
| reviewer | Lead Implementation Engineer |
| الفرع | `feature/sprint-5-reference-data` |
| الهدف | تأسيس CRUD للبيانات المرجعية الخمسة + Seed واقعي من `DB export.sql` وفق ADR-008 |

## Sprint 4 (سبقه — مكتمل)

| البند | الحالة | الدليل |
|-------|--------|--------|
| GAP-M-008/009/010 | ✅ مغلقة | `country.test.ts` 6/6 |
| GAP-M-005/006/007 | ✅ مغلقة | `job.test.ts` 6/6 |
| ADR-007 | ✅ منفّذ | `04-DECISIONS.md` §7 |
| Migrations 006/007 | ✅ مطبَّق + rollback | `migrations/applied/README.md` |
| Regression | ✅ 136 + 3 = 139/139 | `07-TEST-EVIDENCE.md` |
| الفرعان | `feature/GAP-M-008-010-countries` + `feature/GAP-M-005-007-jobs` | غير مدفوعة |

## نتيجة بوابة Sprint 5

| البند | الحالة | الدليل |
|-------|--------|--------|
| 1. 20/20 سيناريو CRUD | ✅ | `reference.test.ts` (4 × 5 كيانات) |
| 2. 2/2 End-to-End + Seed | ✅ | `reference.test.ts` 21–22 |
| 3. اختبارات أمان | ✅ 10/10 | `reference.security.test.ts` |
| 4. اختبارات تكميلية | ✅ 11/11 | `reference.extra.test.ts` |
| 5. اختبارات وحدة | ✅ 12/12 | `reference.validation.test.ts` |
| 6. Regression | ✅ 191 backend + 3 frontend = 194/194 | `07-TEST-EVIDENCE.md` |
| 7. Migrations 008/009/010 idempotent + rollback | ✅ | rollback ثم إعادة تطبيق |
| 8. `ihris_manage` لم تُمسّ | ✅ | 0 أعمدة/جداول جديدة |
| 9. ADR-008 مكتوب قبل التنفيذ | ✅ | `04-DECISIONS.md` §8 |
| 10. Seed موثّق صفاً بصف | ✅ | `migrations/seeds/README.md` |

**الخلاصة: البوابة اجتُزت ✅.**

## حالة الفجوات الثماني

| معرف | العنوان | الحالة | الملاحظة |
|-------|---------|--------|----------|
| GAP-FE-010 | إضافة درجة راتب | ✅ **مكتملة** | create + 409 + audit |
| GAP-FE-011 | تعديل درجة راتب | ✅ **مكتملة** | version lock + audit |
| GAP-FE-012 | حذف درجة راتب | ✅ **مكتملة** | 200 بلا مراجع + 422 عند الاستخدام |
| GAP-M-012 | Cadre CRUD | ✅ **مكتملة** | مسار `cadres` + صفحة |
| GAP-M-013 | Classification CRUD | ✅ **مكتملة** | مسار `classifications` + صفحة |
| GAP-M-014 | Position Type CRUD | ✅ **مكتملة** | مسار `position-types` + صفحة |
| GAP-M-015 | Salary Source CRUD | ✅ **مكتملة** | مسار `salary-sources` + صفحة |
| GAP-M-004 | عرض تفاصيل وظيفة | ✅ **مكتملة** | `JobDetail.tsx` + مناصب مرتبطة |

## حالة العوائق

| معرف | الحالة | القرار |
|-------|--------|--------|
| BLK-011 (جداول مرجعية فارغة) | ✅ مغلق | Seed 26 صفاً + CRUD + E2E |
| BLK-006 (جودة تقارير الدراسة) | مفتوح | ملحق تصحيحي؛ البند السابع أُضيف |
| BLK-007 (`user_log`) | مؤجل P2 | لم يبدأ |

## ما أُنجز في Sprint 5

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | تحليل GAP-M-012 + استخراج 26 صفاً من `DB export.sql` | ✅ |
| 2 | ADR-008 (10 قرارات) | ✅ |
| 3 | Migrations 008/009/010 + rollbacks | ✅ |
| 4 | Prisma schema (5 نماذج + `ReferenceDataAuditLog`) | ✅ |
| 5 | `referenceData.validation.ts` + `referenceData.service.ts` | ✅ |
| 6 | `reference.controller.ts` + `routes/reference.ts` + `app.ts` | ✅ |
| 7 | `ReferenceDataManager.tsx` + 5 صفحات | ✅ |
| 8 | `JobDetail.tsx` + `positions` في `GET /api/jobs/:id` | ✅ |
| 9 | Routes + nav في `App.tsx`/`MainLayout.tsx` | ✅ |
| 10 | 22 قبول/E2E + 10 أمان + 11 تكميلي + 12 وحدة | ✅ |
| 11 | Regression + توثيق الإغلاق | ✅ |

## التحقق من القيود

| البند | الحالة | الملاحظة |
|-------|--------|---------|
| `DB export.sql` دون تعديل | ✅ | قراءة فقط |
| قاعدة `ihris_manage` دون تعديل | ✅ | الـseed على `ihris_test_gap001` فقط |
| قاعدة الاختبار لم تُحذف | ✅ | محفوظة للمراجعة البشرية |
| `docs/legacy-modern-comparison/` | ✅ | لم يُلمس |
| نطاق Sprint 5 | ✅ | CRUD مرجعي + seed + JobDetail فقط |
| ADR-008 | ✅ | منفّذ |
| Seed في migration منفصل | ✅ | 010 مستقل عن 008/009 |
| Seed غير تلقائي في الإنتاج | ✅ | pending؛ لم يُسجَّل في applied |

## الخطوة التالية

**لا تبدأ Sprint 6 قبل اعتماد تقرير Sprint 5.** عند الاعتماد:
1. Sprint 6: فجوات إدارة الطلبات (`GAP-H-003..010` + `GAP-FE-013..016`) — 12 فجوة.
2. أو `GAP-L-002` المتبقي (PDF عربي + Excel) إن كانت الأولوية إدارية.
3. BLK-007 (`user_log`) مؤجل إلى P2 — لا يبدأ الآن.
4. بند متابعة: تحويل `positions.source` إلى FK على `salary_sources` (ADR-008 §8.5).

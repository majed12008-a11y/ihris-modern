# Sprint الحالي — Sprint 6 (وحدة التدريب + Polish) — مكتمل

## معلومات Sprint

| البند | القيمة |
|-------|--------|
| الاسم | Sprint 6 — GAP-FE-007/008/009 + GAP-H-001/002 + Polish + tech debt |
| التاريخ | 14 نوفمبر 2026 |
| الحالة | ✅ **مكتمل — 5 فجوات مغلقة + BLK-012 مغلق** |
| reviewer | Lead Implementation Engineer |
| الفرع | `feature/sprint-6-training` |
| الهدف | إغلاق وحدة التدريب end-to-end + تجميع التنقّل + عرض تفاصيل 422 + `positions.sourceId` FK |
| السابق | Sprint 5.5 (تحصين أمني) — معتمد |

## Sprint 5.5 (سبقه — معتمد)

| البند | الحالة | الدليل |
|-------|--------|--------|
| فصل البيئات `.env.local`/`.env.test` | ✅ | `.gitignore` + `src/config/index.ts` |
| `ihris_test_user` معزول | ✅ | صلاحيات على `ihris_test_gap001` فقط |
| 6 حواجز preflight | ✅ | `jest.globalSetup.js` + `scripts/test-preflight.js` |
| Transaction wrapper | ✅ | `src/__tests__/setup.ts` + Proxy |
| Regression | ✅ 194 backend + 3 frontend | `07-TEST-EVIDENCE.md` |

## نتيجة بوابة Sprint 6

| البند | الحالة | الدليل |
|-------|--------|--------|
| 1. 18/18 سيناريو قبول | ✅ | 17 في `training.test.ts` + 1 في `MainLayout.test.tsx` |
| 2. 10/10 أمان | ✅ | `training.security.test.ts` |
| 3. اختبارات وحدة | ✅ 6/6 | `training.validation.test.ts` |
| 4. Regression | ✅ 227 backend + 7 frontend | `07-TEST-EVIDENCE.md` |
| 5. Migrations 011/012/013/014 idempotent + rollback | ✅ | rollback ثم إعادة تطبيق |
| 6. `ihris_manage` لم تُمسّ | ✅ | الـseed على `ihris_test_gap001` فقط |
| 7. ADR-009 (10 قرارات) قبل التنفيذ | ✅ | `04-DECISIONS.md` §9 |
| 8. Seed موثّق صفاً بصف | ✅ | `migrations/seeds/README.md` §6 |
| 9. `positions.sourceId` FK يعمل | ✅ | 013 + `training.test.ts` 16–17 |
| 10. لا push | ✅ | الفرع محلي فقط |

**الخلاصة: البوابة اجتُزت ✅.**

## حالة الفجوات الخمس

| معرف | العنوان | الحالة | الملاحظة |
|-------|---------|--------|----------|
| GAP-007 / GAP-FE-007 | تعديل دورة تدريبية | ✅ **مكتملة** | نموذج موحّد + version lock (409) |
| GAP-FE-008 | حذف دورة تدريبية | ✅ **مكتملة** | حذف ناعم + 422 عند وجود دورات مجدولة |
| GAP-FE-009 | إضافة مؤسسة تدريبية | ✅ **مكتملة** | CRUD كامل + 422 عند الارتباط |
| GAP-H-001 | إضافة دورة مجدولة | ✅ **مكتملة** | create/update + آلة حالة + version |
| GAP-H-002 | عرض المتدربين | ✅ **مكتملة** | تسجيل/إتمام/حذف + بحث أشخاص |

## حالة العوائق

| معرف | الحالة | القرار |
|-------|--------|--------|
| BLK-012 (وحدة تدريب ناقصة) | ✅ مغلق | CRUD كامل + audit + 33 اختباراً |
| BLK-006 (جودة تقارير الدراسة) | مفتوح | ملحق تصحيحي؛ ينتظر اطلاع الإدارة |
| BLK-007 (`user_log`) | مؤجل P2 | لم يبدأ |

## ما أُنجز في Sprint 6

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | تحليل GAP-H-001/002 + GAP-FE-007/008/009 واستخراج 16 صفاً | ✅ |
| 2 | ADR-009 (10 قرارات) | ✅ |
| 3 | Migrations 011/012/013/014 + rollbacks | ✅ |
| 4 | Prisma schema (`version`/`deletedAt`/`status`/`sourceId` + `TrainingAuditLog`) | ✅ |
| 5 | `training.validation.ts` + `training.service.ts` | ✅ |
| 6 | `training.controller.ts` + `routes/training.ts` | ✅ |
| 7 | `Training.tsx` + `TrainingForm.tsx` + `TrainingInstitutions.tsx` | ✅ |
| 8 | `ScheduledCourseForm.tsx` + `EnrolledStudents.tsx` | ✅ |
| 9 | Routes + تجميع التنقّل + `lib/errorDetails.ts` | ✅ |
| 10 | 17 قبول + 10 أمان + 6 وحدة + 4 واجهة | ✅ |
| 11 | Regression + توثيق الإغلاق | ✅ |

## التحقق من القيود

| البند | الحالة | الملاحظة |
|-------|--------|---------|
| `DB export.sql` دون تعديل | ✅ | قراءة فقط |
| قاعدة `ihris_manage` دون تعديل | ✅ | الـseed على `ihris_test_gap001` فقط |
| قاعدة الاختبار لم تُحذف | ✅ | محفوظة للمراجعة البشرية |
| `docs/legacy-modern-comparison/` | ✅ | لم يُلمس |
| نطاق Sprint 6 | ✅ | 5 فجوات تدريبية + Polish + tech debt فقط |
| ADR-009 | ✅ | منفّذ بالكامل |
| Seed في migration منفصل | ✅ | 014 مستقل عن 011/012/013 |
| Seed غير تلقائي في الإنتاج | ✅ | pending؛ لم يُسجَّل في applied |
| لا push | ✅ | الفرع `feature/sprint-6-training` محلي |

## الخطوة التالية

**لا تبدأ Sprint 7 قبل اعتماد تقرير Sprint 6.** عند الاعتماد:
1. Sprint 7: فجوات إدارة الطلبات (`GAP-H-003..010` + `GAP-FE-013..016`) — 12 فجوة.
2. أو `GAP-L-002` المتبقي (PDF عربي + Excel) إن كانت الأولوية إدارية.
3. BLK-007 (`user_log`) مؤجل إلى P2 — لا يبدأ الآن.
4. Seed التسجيل التدريبي (15384/15393) عند ترحيل `people`.

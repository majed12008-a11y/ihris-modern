# سجل التغييرات (Changelog)

## [0.6.0] - 08 نوفمبر 2026 — Sprint 4 (البيانات المرجعية)

### أُضيف
- **GAP-M-008**: ✅ إضافة دولة (backend + UI + audit + 409).
- **GAP-M-009**: ✅ تعديل دولة (version lock + audit).
- **GAP-M-010**: ✅ حذف دولة (حماية 6 مراجع → 422 + audit يبقى بعد الحذف).
- **GAP-M-005**: ✅ إضافة مسمى وظيفي (backend + UI + cascade + 409).
- **GAP-M-006**: ✅ تعديل مسمى وظيفي (version lock + audit).
- **GAP-M-007**: ✅ حذف مسمى وظيفي (حماية `positions` → 422).

### تغييرات
- ترحيل `006_country_version_and_audit.sql` — `countries.version` + `country_audit_log` + 3 فهارس.
- ترحيل `007_job_version_and_audit.sql` — `jobs.version` + `job_audit_log` + فهارس title/code.
- ADR-007 (10 قرارات) في `04-DECISIONS.md` §7.
- `country.validation.ts` + `country.service.ts` (create/update/delete/list + audit).
- `job.validation.ts` + `job.service.ts` (CRUD + cascade + audit + حماية positions).
- `/api/countries` (4 نقاط) و`/api/jobs` (4 + 3 meta).
- `Countries.tsx` + `Jobs.tsx` + routes + عنصرا تنقّل.
- اختبارات Sprint 4: 12 قبول + 8 أمان + 8 وحدة = **28**.

### مُغلق
- **BLK-009**: `regions` تبقى مستقلة (Revisit P3).
- **BLK-010**: لا عمود `code` في `hippo_facility` → `not in old system — deferred`.

### مؤجل
- **GAP-M-004** (عرض تفاصيل وظيفة) — اختيارية، لم تُنفَّذ.

### الأرقام
- Backend: 108 → **136/136** (19 suites).
- Frontend: **3/3**.
- الإجمالي: **139/139**.
- التقدم: 7/44 → **13/44 = 29.5%**.

## [0.5.0] - 06 نوفمبر 2026 — Sprint 2.5 + Sprint 3

### أُغلق
- **BLK-008**: ✅ آلية تعطيل/تفعيل الحساب (`isActive` + مسارين admin + 401 + badge + audit).
- **GAP-004**: ✅ مكتملة — إضافة منشأة (backend + UI + cascade + audit).
- **GAP-005**: ✅ مكتملة — تعديل منشأة (version lock + audit).
- **GAP-006**: ✅ مكتملة — عرض تفاصيل منشأة + الوظائف المرتبطة.
- **GAP-L-003**: ✅ مكتملة — تتبع استخدام التقارير معروض في الواجهة وAPI موجود.
- **RISK-007**: ✅ مغلق (واجهة إدارة المنشآت).
- **RISK-021**: ✅ مغلق (تتبع استخدام التقارير).

### أضيف
- ترحيل `003_user_active_flag.sql` — `isActive` + فهرس `(isActive, deletedAt)` + توسيع CHECK للتدقيق.
- ترحيل `004_user_token_version.sql` — `tokenVersion` لإبطال JWT.
- ترحيل `005_facility_version_and_audit.sql` — `facilities.version` + `facility_audit_log` + فهارس.
- ملفات Rollback مطابقة للثلاثة + إثبات idempotency وإعادة التطبيق.
- ADR-005 (إبطال JWT عبر `tokenVersion`) وADR-006 (تصميم إدارة المنشآت).
- `PUT /api/users/:id/deactivate` و`PUT /api/users/:id/activate` (admin فقط).
- `facility.validation.ts` — Zod strict + BR-097 + version.
- إعادة كتابة `facility.service.ts` — pagination + search + cascade meta + uniqueness + version lock + audit + delete guard.
- `/api/facilities/meta/{countries,districts,counties,regions,facility-types}`.
- `Facilities.tsx` + `FacilityDetail.tsx` + إعادة كتابة `FacilityForm.tsx` + routes + nav.
- اختبارات: 11 (Sprint 2.5) + 10 قبول + 8 أمان + 6 وحدة (Sprint 3) = **35 اختباراً جديداً**.

### صُحِّح
- `middleware/auth.ts`: تحقق DB لكل طلب (tokenVersion/isActive/deletedAt) بدل الاعتماد على الـ JWT فقط.
- الدور يُقرأ من DB لا من الرمز → تغيير الدور يسري فوراً.
- `Dashboard.tsx`: `facilitiesRes.data.total` بدل `.length` بعد تحويل القائمة إلى paginated.
- رسالة رفض حذف المستخدم ذات السجلات تُذكر "يمكنك تعطيله" مع إمكانية فعلية.

### ملاحظات
- **GAP-L-002** جزئية 55% ومؤجلة P2 (Arabic PDF + Excel).
- **BLK-007** (`user_log`) مؤجل P2 — لم يبدأ.
- **BLK-009** (`regions` بلا `countryId`) و**BLK-010** (لا `code` في `facilities`) مفتوحان.
- لا إبطال JWT لكل جهاز (Refresh Tokens في P3).
- التقدم: **7/44 = 15.9%**.

## [0.4.0] - 05 نوفمبر 2026 — Sprint 2 (إغلاق GAP-002 + GAP-003)

### أُغلق
- **GAP-002**: ✅ مكتملة — تعديل ذاتي + admin، تحقق Zod، Optimistic Lock، Audit، واجهة تعديل.
- **GAP-003**: ✅ مكتملة — Soft Delete + Restore خلال 30 يوماً + سجل تدقيق + صفحة محذوفين.
- **RISK-002** و**RISK-003**: ✅ مغلقتان في `06-RISK-TRACKER.md`.

### أضيف
- ترحيل `002_user_soft_delete_and_audit.sql` — `version` + `deletedAt/deletedBy/deletionReason/restoredAt` + `user_audit_log` + فهارس.
- ملف Rollback مطابق + إثبات idempotency وإعادة التطبيق.
- `UserService.getById/update/softDelete/restore/listDeleted/relatedRecordCounts`.
- مخططات Zod صارمة في `user.validation.ts` + أخطاء HTTP موحدة في `lib/httpError.ts`.
- مسارات: `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`, `POST /api/users/:id/restore`, `GET /api/users/deleted`.
- حظر تسجيل دخول المستخدم المحذوف (401).
- واجهة: صفحة تعديل مستخدم + ملف شخصي، Modal حذف بسبب، صفحة المستخدمين المحذوفين + استعادة.
- اختبارات: 12 سيناريو قبول + 10 أمان + 9 وحدة (31 اختباراً جديداً).

### صُحِّح
- `GET /api/users` يستثني المحذوفين منطقياً.
- `POST /api/users/:id/role` أصبح يتطلب `version` ويكتب audit (مسار قديم deprecated).
- `jest.config.js`: `maxWorkers: 1` لمنع تداخل `deleteMany` بين suites على قاعدة اختبار واحدة.

### ملاحظات
- Purge بعد 90 يوماً مؤجل P3.
- `user_log` (login/logout/activity) مفقود — BLK-007 خارج النطاق.
- لا آلية تعطيل `isActive` — BLK-008 يحتاج قراراً.
- JWT قديم لا يُبطَل فور الحذف/تغيير الدور.

## [0.3.0] - 05 نوفمبر 2026 — Sprint 1.5b + 1.5c (إغلاق GAP-001)

### أُغلق
- **GAP-001**: ✅ مكتملة — محرك تقارير حقيقي + 10/10 سيناريوهات + regression 45/45.
- **BLK-001**: العدد الكانوني 44 (إداري 22).
- **BLK-003**: محرك SQL حقيقي بدل stub.
- **BLK-004**: قاعدة اختبار `ihris_test_gap001` + ترحيل مطبَّق.
- **BLK-005**: `npm ci` نظيف + `jest-util`.

### أضيف
- `report.engine.ts` — بناء وتنفيذ SQL parameterized + GROUP BY/ORDER BY + حدود.
- `report.whitelist.ts` — 25 جدولاً مسموحاً + حظر `password` + regex.
- `report.export.service.ts` — CSV (BOM/CRLF) + PDF (pdfkit).
- `middleware/rateLimit.ts` — 10 تنفيذات/دقيقة/مستخدم.
- `POST /api/reports/:id/export?format=csv|pdf`.
- `report.engine.test.ts` — 12 اختباراً.
- 9 اختبارات إضافية في `report.test.ts` (params/CSV/PDF/401/400/update/delete/injection).
- `CORRECTED-GAP-REGISTRY.md` — 44 فجوة + 6 عيوب في التقارير الأصلية.
- ADR-003 (سياسة إدارة المستخدمين) وADR-004 (تصميم المحرك) في `04-DECISIONS.md`.
- BLK-006 — عيوب جودة بيانات تقارير الدراسة.

### صُحِّح
- الترحيل: snake_case → camelCase (`isEnabled`, `createdBy`, ...) لمطابقة Prisma.
- `AuthService.login`: 401 بدل 500.
- اختبارات person/position: منح دور admin + إنشاء منشأة بدل `facilityId: 1`.
- `Login.tsx`: `htmlFor`/`id` للحقول.
- `jest.config.js`: `forceExit` + `testTimeout: 30000`.
- نصوص "مكتمل جزئياً" و"stub" في جميع الوثائق.

### ملاحظات
- PDF لا يشكّل العربية (قيد `pdfkit`).
- Rate limit في الذاكرة لكل عملية Node.
- لا JOIN في المحرك.

## [0.2.1] - 04 نوفمبر 2026 — Sprint 1.5 (مراجعة وتصحيح)

### صُحِّح
- **حالة GAP-001**: من "مكتمل" إلى **"مكتمل جزئياً"** في `verification.md`, `DASHBOARD.md`,
  وملحق `12-GAP-ANALYSIS.md`.
- **أدلة اختبار مضلّلة**: ادعاء 16/16 اختباراً ناجحاً في `07-TEST-EVIDENCE.md` كان بلا ملفات
  اختبار. استُبدل بمخرجات حقيقية (7/7 اختبارات وحدة) وتوثيق صريح للاختبارات غير المشغّلة.
- **مخطط Prisma**: أُضيفت حقول العلاقات العكسية المفقودة على `User` و`ReportDefinition`
  (`createdByUser`, `reportExecutions`, `reportPreferences`) — المخطط لم يكن صالحاً قبلها.
- **متحكم التقارير**: استخدام `AuthRequest` بدل `Request` — الخلفية لم تكن تُترجم قبلها.
- **الترحيل**: تصحيح المراجع من `"user"` إلى `"users"` (اسم الجدول الفعلي).
- **rollback**: إنشاء `migrations/rollback/001_create_report_tables_rollback.sql`
  (الاسم السابق `001_drop_report_tables.sql` لا يطابق التسمية المطلوبة).

### أضيف
- `backend/src/__tests__/report.validation.test.ts` — 7 اختبارات وحدة حقيقية (ناجحة).
- `backend/src/__tests__/report.test.ts` — 3 اختبارات تكامل حقيقية (مكتوبة، محجوبة).
- إصلاح `jest.config.js` لاستخدام `transform` بدل preset المعطوب.
- `05-BLOCKERS.md`: BLK-003 (محرك stub)، BLK-004 (ترحيل معلّق)، BLK-005 (تلف node_modules).

### خطأ إجرائي موثّق
- **العمل تم على `main` دون فرع مخصص** في Sprint 1. لم يكن هناك فرع ولا commits.
- المعالجة: أُنشئ الفرع `feature/GAP-001-custom-reports` في Sprint 1.5 ونُقل إليه العمل
  عبر commits مرتبطة بـ `[GAP-001]`.
- **كيف نتجنبه في Sprint 2:** إنشاء الفرع **قبل** أول تعديل، والالتزام بـ commit بعد كل مهمة
  (وليست دفعة واحدة في النهاية).

## [0.2.0] - 04 نوفمبر 2026

> ⚠️ ملاحظة: بعض ادعاءات هذا الإصدار (اكتمال GAP-001 و16/16 اختباراً) صُحِّحت في 0.2.1.

### أضيف
- نظام التقارير المخصص (Custom Reports System) - GAP-001
  - نموذج ReportDefinition في Prisma schema
  - نموذج ReportExecution في Prisma schema
  - نموذج ReportPreference في Prisma schema
  - خدمة تقرير (report.service.ts) مع عمليات CRUD وتنفيذ التقارير
  - خدمة التحقق من صحة تعريفات التقارير (report.validation.service.ts)
  - متحكم التقارير (report.controller.ts) مع 10 نقاط نهاية API
  - مسار API /api/reports مع 10 نقاط نهاية
  - صفحة قائمة التقارير (Reports.tsx)
  - صفحة تفاصيل التقرير (ReportDetail.tsx)
  - صفحة إضافة/تعديل تقرير (ReportForm.tsx)
  - صفحة تنفيذ وعرض تقرير (ReportExecute.tsx)
  - مسارات واجهة المستخدم للتقارير (6 مسارات)

### تم التعديل
- backend/src/app.ts - إضافة مسار /api/reports
- frontend/src/App.tsx - إضافة مسارات التقارير (6 مسارات)
- backend/prisma/schema.prisma - إضافة نماذج ReportDefinition, ReportExecution, ReportPreference

### سكريبتات الترحيل
- migrations/pending/001_create_report_tables.sql - إنشاء جداول التقارير

## [0.1.0] - 04 نوفمبر 2026

### أضيف
- إنشاء هيكل ihris-modern/ بالكامل
- إنشاء خلفية Node.js + Express + TypeScript + Prisma
- إنشاء واجهة أمامية React + TypeScript + Vite + Tailwind CSS
- إنشاء مخطط قاعدة بيانات PostgreSQL مع 52 نموذج
- إنشاء 31 مسار API للتقارير، الأشخاص، الوظائف، المنشآت، الرواتب، التدريب، المستخدمين
- إنشاء 12 صفحة واجهة أمامية
- إنشاء سكريبت ترحيل البيانات من MySQL إلى PostgreSQL
- إنشاء Docker Compose للنشر السريع
- إنشاء خطة التنفيذ (PLAN_AR.md)

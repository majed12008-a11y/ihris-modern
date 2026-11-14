# مصفوفة الأدلة (Evidence Matrix) - iHRIS Modern Implementation

## 1. نظرة عامة

توثق هذه المصفوفة أدلة تنفيذ نظام التقارير المخصص (GAP-001) وإدارة المستخدمين
(GAP-002 + GAP-003). بعد Sprint 1.5b/1.5c وSprint 2 جميع أدلة الاختبار أصبحت
**FACT** مبنية على تشغيل فعلي، لا على استنتاج.

---

## 2. أدلة النظام الحديث (من الكود والمخططات)

| معرف الدليل | العنصر | المصدر | المسار | النوع | الوصف | مستوى الثقة |
|-------------|--------|---------|--------|-------|-------|-------------|
| EVID-183 | نموذج ReportDefinition | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف نموذج تعريفات التقارير | مؤكدة |
| EVID-184 | نموذج ReportExecution | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف نموذج سجل تنفيذ التقارير | مؤكدة |
| EVID-185 | نموذج ReportPreference | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف نموذج تفضيلات التقارير | مؤكدة |
| EVID-186 | خدمة تقرير | كود الخلفية | `backend/src/services/report.service.ts` | FACT | إدارة التقارير + دمج المعاملات + سجل التنفيذ | مؤكدة |
| EVID-187 | خدمة التحقق | كود الخلفية | `backend/src/services/report.validation.service.ts` | FACT | تحقق whitelist + identifiers عند الإنشاء | مؤكدة |
| EVID-188 | متحكم التقارير | كود الخلفية | `backend/src/controllers/report.controller.ts` | FACT | معالجات الطلبات + `exportReport` | مؤكدة |
| EVID-189 | مسار API التقارير | كود الخلفية | `backend/src/routes/report.ts` | FACT | 11 مساراً تحت `/api/reports` | مؤكدة |
| EVID-190 | صفحة قائمة التقارير | كود الواجهة الأمامية | `frontend/src/pages/Reports.tsx` | FACT | صفحة قائمة التقارير | مؤكدة |
| EVID-191 | صفحة تفاصيل التقرير | كود الواجهة الأمامية | `frontend/src/pages/ReportDetail.tsx` | FACT | صفحة تفاصيل التقرير | مؤكدة |
| EVID-192 | صفحة إضافة/تعديل تقرير | كود الواجهة الأمامية | `frontend/src/pages/ReportForm.tsx` | FACT | صفحة إضافة/تعديل تقرير | مؤكدة |
| EVID-193 | صفحة تنفيذ تقرير | كود الواجهة الأمامية | `frontend/src/pages/ReportExecute.tsx` | FACT | صفحة تنفيذ وعرض تقرير | مؤكدة |
| EVID-194 | مسار API التقارير | كود الخلفية | `backend/src/app.ts` | FACT | إضافة `/api/reports` إلى التطبيق | مؤكدة |
| EVID-195 | سكريبت ترحيل التقارير | ملف SQL | `migrations/pending/001_create_report_tables.sql` | FACT | camelCase + idempotent | مؤكدة |
| EVID-196 | محرك التنفيذ | كود الخلفية | `backend/src/services/report.engine.ts` | FACT | build/execute + حدود + timeout | مؤكدة |
| EVID-197 | القائمة البيضاء | كود الخلفية | `backend/src/services/report.whitelist.ts` | FACT | 25 جدولاً + حظر `password` + regex | مؤكدة |
| EVID-198 | خدمة التصدير | كود الخلفية | `backend/src/services/report.export.service.ts` | FACT | CSV (BOM/CRLF) + PDF (pdfkit) | مؤكدة |
| EVID-199 | حد المعدل | كود الخلفية | `backend/src/middleware/rateLimit.ts` | FACT | 10 تنفيذات/دقيقة/مستخدم | مؤكدة |
| EVID-200 | خدمة المستخدمين | كود الخلفية | `backend/src/services/user.service.ts` | FACT | getById/update/softDelete/restore/listDeleted + audit | مؤكدة |
| EVID-201 | تحقق المستخدمين | كود الخلفية | `backend/src/services/user.validation.ts` | FACT | Zod صارم (`.strict`) + رسائل عربية | مؤكدة |
| EVID-202 | متحكم المستخدمين | كود الخلفية | `backend/src/controllers/user.controller.ts` | FACT | GET/PUT/DELETE/restore/listDeleted | مؤكدة |
| EVID-203 | مسارات المستخدمين | كود الخلفية | `backend/src/routes/user.ts` | FACT | 7 مسارات + requireRole | مؤكدة |
| EVID-204 | أخطاء HTTP | كود الخلفية | `backend/src/lib/httpError.ts` | FACT | 400/403/404/409/422 | مؤكدة |
| EVID-205 | منع دخول المحذوف | كود الخلفية | `backend/src/services/auth.service.ts` | FACT | `deletedAt != null` → 401 | مؤكدة |
| EVID-206 | أعمدة Soft Delete | Prisma Schema | `backend/prisma/schema.prisma` | FACT | `version/deletedAt/deletedBy/deletionReason/restoredAt` | مؤكدة |
| EVID-207 | نموذج UserAuditLog | Prisma Schema | `backend/prisma/schema.prisma` | FACT | جدول audit بلا FK + 3 فهارس | مؤكدة |
| EVID-208 | ترحيل 002 | ملف SQL | `docs/implementation/migrations/pending/002_user_soft_delete_and_audit.sql` | FACT | idempotent + CHECK + فهارس | مؤكدة |
| EVID-209 | Rollback 002 | ملف SQL | `docs/implementation/migrations/rollback/002_user_soft_delete_and_audit_rollback.sql` | FACT | مُختبَر ثم أُعيد التطبيق | مؤكدة |
| EVID-210 | صفحة المستخدمين | كود الواجهة | `frontend/src/pages/Users.tsx` | FACT | أزرار تعديل/حذف + modal سبب | مؤكدة |
| EVID-211 | صفحة تعديل مستخدم | كود الواجهة | `frontend/src/pages/UserForm.tsx` | FACT | create/edit + version + تقييد الدور | مؤكدة |
| EVID-212 | صفحة المحذوفين | كود الواجهة | `frontend/src/pages/DeletedUsers.tsx` | FACT | عرض + استعادة + عدّاد 30 يوماً | مؤكدة |
| EVID-213 | مسارات الواجهة والملف الشخصي | كود الواجهة | `frontend/src/App.tsx` + `MainLayout.tsx` | FACT | `users/:id/edit`, `users/deleted`, ملفي الشخصي | مؤكدة |
| EVID-214 | نوع هوية المستخدم | كود الخلفية | `backend/src/middleware/auth.ts` | FACT | `AuthUser` + `AuthRequest` | مؤكدة |
| EVID-215 | عمود `isActive` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | boolean افتراضي true + فهرس مركّب | مؤكدة |
| EVID-216 | عمود `tokenVersion` | Prisma Schema | `backend/prisma/schema.prisma` | FACT | int افتراضي 1 | مؤكدة |
| EVID-217 | ترحيل 003 | ملف SQL | `migrations/pending/003_user_active_flag.sql` | FACT | idempotent + rollback + توسيع CHECK | مؤكدة |
| EVID-218 | ترحيل 004 | ملف SQL | `migrations/pending/004_user_token_version.sql` | FACT | idempotent + rollback | مؤكدة |
| EVID-219 | تحقق DB للمصادقة | كود الخلفية | `backend/src/middleware/auth.ts` | FACT | tokenVersion/isActive/deletedAt لكل طلب | مؤكدة |
| EVID-220 | رفض دخول المعطّل | كود الخلفية | `backend/src/services/auth.service.ts` | FACT | `isActive=false` → 401 | مؤكدة |
| EVID-221 | تعطيل/تفعيل | كود الخلفية | `backend/src/services/user.service.ts` | FACT | deactivate/activate + audit + version | مؤكدة |
| EVID-222 | مسارا التعطيل | كود الخلفية | `backend/src/routes/user.ts` | FACT | `PUT /:id/deactivate` + `/:id/activate` | مؤكدة |
| EVID-223 | تبويبات حالة المستخدم | كود الواجهة | `frontend/src/pages/Users.tsx` | FACT | الكل/النشطون/المعطّلون + badge | مؤكدة |
| EVID-224 | ترحيل 005 | ملف SQL | `migrations/pending/005_facility_version_and_audit.sql` | FACT | version + facility_audit_log | مؤكدة |
| EVID-225 | نموذج FacilityAuditLog | Prisma Schema | `backend/prisma/schema.prisma` | FACT | بلا FK + 3 فهارس | مؤكدة |
| EVID-226 | تحقق المنشآت | كود الخلفية | `backend/src/services/facility.validation.ts` | FACT | Zod strict + BR-097 | مؤكدة |
| EVID-227 | خدمة المنشآت | كود الخلفية | `backend/src/services/facility.service.ts` | FACT | CRUD + cascade + audit + delete guard | مؤكدة |
| EVID-228 | نقاط نهاية المنشآت | كود الخلفية | `backend/src/routes/facility.ts` | FACT | CRUD + 5 meta + RBAC | مؤكدة |
| EVID-229 | قائمة المنشآت | كود الواجهة | `frontend/src/pages/Facilities.tsx` | FACT | بحث + ترقيم + إجراءات + modal حذف | مؤكدة |
| EVID-230 | تفاصيل المنشأة | كود الواجهة | `frontend/src/pages/FacilityDetail.tsx` | FACT | كل الحقول + الوظائف المرتبطة | مؤكدة |
| EVID-231 | نموذج المنشأة | كود الواجهة | `frontend/src/pages/FacilityForm.tsx` | FACT | cascade API-driven + prefill + version | مؤكدة |
| EVID-232 | ترحيل 008 (مخطط مرجعي) | ملف SQL | `migrations/pending/008_reference_data_schema.sql` | FACT | توسيع 4 جداول + `salary_sources` + `version` + فهارس | مؤكدة |
| EVID-233 | ترحيل 009 (تدقيق موحّد) | ملف SQL | `migrations/pending/009_reference_data_audit.sql` | FACT | `reference_data_audit_log` + CHECK + 3 فهارس | مؤكدة |
| EVID-234 | ترحيل 010 (Seed) | ملف SQL | `migrations/pending/010_seed_reference_data.sql` | FACT | 26 صفاً FACT + `ON CONFLICT (code) DO NOTHING` | مؤكدة |
| EVID-235 | Rollbacks 008/009/010 | ملفات SQL | `migrations/rollback/008..010_*_rollback.sql` | FACT | مُختبَرة: rollback ثم إعادة تطبيق | مؤكدة |
| EVID-236 | خدمة البيانات المرجعية | كود الخلفية | `backend/src/services/referenceData.service.ts` | FACT | CRUD عام + audit + 409 + 422 + version | مؤكدة |
| EVID-237 | تحقق البيانات المرجعية | كود الخلفية | `backend/src/services/referenceData.validation.ts` | FACT | 10 مخططات `.strict()` + رسائل عربية | مؤكدة |
| EVID-238 | متحكم ومسارات المرجعية | كود الخلفية | `backend/src/controllers/reference.controller.ts` + `routes/reference.ts` | FACT | 5 كيانات × GET/POST/PUT/DELETE + RBAC | مؤكدة |
| EVID-239 | مكوّن الإدارة المرجعية | كود الواجهة | `frontend/src/components/reference/ReferenceDataManager.tsx` | FACT | CRUD عام + بحث + ترقيم + modals | مؤكدة |
| EVID-240 | صفحة درجات الرواتب | كود الواجهة | `frontend/src/pages/SalaryGrades.tsx` | FACT | GAP-FE-010/011/012 | مؤكدة |
| EVID-241 | صفحة الفئات | كود الواجهة | `frontend/src/pages/Cadres.tsx` | FACT | GAP-M-012 | مؤكدة |
| EVID-242 | صفحة التصنيفات | كود الواجهة | `frontend/src/pages/Classifications.tsx` | FACT | GAP-M-013 | مؤكدة |
| EVID-243 | صفحة أنواع الوظائف | كود الواجهة | `frontend/src/pages/PositionTypes.tsx` | FACT | GAP-M-014 | مؤكدة |
| EVID-244 | صفحة مصادر الرواتب | كود الواجهة | `frontend/src/pages/SalarySources.tsx` | FACT | GAP-M-015 | مؤكدة |
| EVID-245 | صفحة تفاصيل المسمى | كود الواجهة | `frontend/src/pages/JobDetail.tsx` | FACT | GAP-M-004 + مناصب مرتبطة | مؤكدة |
| EVID-246 | توثيق الـSeed | وثيقة | `migrations/seeds/README.md` | FACT | 26 صفاً بالسطر/المصدر/FACT-DERIVED | مؤكدة |
| EVID-247 | ADR-008 | وثيقة | `docs/implementation/04-DECISIONS.md` §8 | FACT | 10 قرارات قبل التنفيذ | مؤكدة |

---

## 3. أدلة الاختبار (تشغيل فعلي)

| معرف الدليل | العنصر | المصدر | النوع | الوصف | مستوى الثقة |
|-------------|--------|---------|-------|-------|-------------|
| EVID-T-001 | إنشاء تقرير | `report.test.ts` | FACT | POST → 201 ثم GET → 200 بنفس القيم | مؤكدة |
| EVID-T-002 | تشغيل تقرير | `report.test.ts` + `report.engine.ts` | FACT | SQL فعلي يعيد 3 صفوف حقيقية | مؤكدة |
| EVID-T-003 | تصدير CSV | `report.test.ts` | FACT | `text/csv` + بيانات عربية + `X-Report-Row-Count: 3` | مؤكدة |
| EVID-T-004 | SQL ضار | `report.engine.test.ts` + `report.test.ts` | FACT | 8 سيناريوهات رفض | مؤكدة |
| EVID-T-005 | مصادقة المستخدم | `report.test.ts` | FACT | بلا توكن/توكن باطل → 401 | مؤكدة |
| EVID-T-006 | حذف تقرير | `report.test.ts` | FACT | DELETE → 204 + اختفاء من القائمة | مؤكدة |
| EVID-T-007 | تعديل تقرير | `report.test.ts` | FACT | PUT → 200 + تنفيذ بالأعمدة الجديدة | مؤكدة |
| EVID-T-008 | معاملات وقت التشغيل | `report.test.ts` | FACT | `params:{name:"فهد"}` → صف واحد | مؤكدة |
| EVID-T-009 | تصدير PDF | `report.test.ts` | FACT | `application/pdf` + `%PDF-` + >500 بايت | مؤكدة |
| EVID-T-010 | اختبارات المحرك | `report.engine.test.ts` | FACT | 12/12 (SQL + security) | مؤكدة |
| EVID-T-011 | Regression | backend + frontend | FACT | 42/42 + 3/3 |
| EVID-T-012 | قبول GAP-002 (1–5) | `user.test.ts` | FACT | 5/5: self-edit/admin/403/400/409 |
| EVID-T-013 | قبول GAP-003 (6–12) | `user.test.ts` | FACT | 7/7: soft delete/422/self-delete/403/restore/422/401 |
| EVID-T-014 | أمان GAP-002/003 | `user.security.test.ts` | FACT | 10/10 (403/401/409/400/422 + IDOR + معايرة) |
| EVID-T-015 | وحدة التحقق | `user.validation.test.ts` | FACT | 9/9 (Zod) |
| EVID-T-016 | Regression بعد Sprint 2 | backend + frontend | FACT | 73/73 + 3/3 + tsc |
| EVID-T-017 | SQL injection في السبب | `user.security.test.ts` | FACT | `x'; DROP TABLE "users"; --` مخزّن حرفياً والجدول سليم |
| EVID-T-018 | Idempotency + Rollback | psql على `ihris_test_gap001` | FACT | تطبيق/إعادة/rollback/إعادة تطبيق |
| EVID-T-019 | RBAC/IDOR | `user.security.test.ts` | FACT | admin endpoint بـJWT عادي → 403 |
| EVID-T-020 | إثبات Soft Delete | PostgreSQL + Prisma | FACT | الصف موجود و`deletedAt` مضبوط |
| EVID-T-021 | نافذة الاستعادة | `user.test.ts` | FACT | ≤30 يوم 200، 40 يوم 422 |
| EVID-T-022 | منع دخول المحذوف | `user.test.ts` | FACT | 401 بعد الحذف | مؤكدة |
| EVID-T-023 | تعطيل/تفعيل (6) | `user.lifecycle.test.ts` | FACT | 200 + audit + 401 + 403 + badge | مؤكدة |
| EVID-T-024 | إبطال JWT (5) | `user.lifecycle.test.ts` | FACT | role change/delete/deactivate/restore/current | مؤكدة |
| EVID-T-025 | Regression Sprint 2.5 | backend + frontend | FACT | 84/84 + 3/3 = 87/87 | مؤكدة |
| EVID-T-026 | تصنيف GAP-L-003 | `ReportDetail.tsx` + `report.ts` | FACT | سجل التنفيذ معروض + `/executions` موجود | مؤكدة |
| EVID-T-027 | قبول GAP-004/005/006 (10) | `facility.test.ts` | FACT | 10/10 كما في 07-TEST-EVIDENCE §3.8 | مؤكدة |
| EVID-T-028 | أمان المنشآت (8) | `facility.security.test.ts` | FACT | 403/401/400/422 + injection + mass assignment | مؤكدة |
| EVID-T-029 | وحدة Zod للمنشآت (6) | `facility.validation.test.ts` | FACT | strict + BR-097 + version | مؤكدة |
| EVID-T-030 | Regression نهائي | backend + frontend | FACT | 108/108 + 3/3 = 111/111 | مؤكدة |
| EVID-T-031 | ترحيلات 003/004/005 | psql على `ihris_test_gap001` | FACT | apply/reapply/rollback/reapply | مؤكدة |
| EVID-T-032 | `ihris_manage` سليمة | psql على `ihris_manage` | FACT | 0 أعمدة/جداول جديدة | مؤكدة |
| EVID-T-033 | قبول GAP-M-008/009/010 (6) | `country.test.ts` | FACT | 6/6: إنشاء/403/409/تعديل/حذف/422 | مؤكدة |
| EVID-T-034 | قبول GAP-M-005/006/007 (6) | `job.test.ts` | FACT | 6/6: إنشاء/403/409/cascade/تعديل/حذف | مؤكدة |
| EVID-T-035 | أمان الدول (4) | `country.security.test.ts` | FACT | 403/401/mass assignment/كائن في `name` | مؤكدة |
| EVID-T-036 | أمان المسميات (4) | `job.security.test.ts` | FACT | mass assignment/409/403/حقن SQL | مؤكدة |
| EVID-T-037 | وحدة Zod (8) | `country.validation.test.ts` + `job.validation.test.ts` | FACT | `.strict()` + `version` + nullable cascade | مؤكدة |
| EVID-T-038 | Regression نهائي (Sprint 4) | backend + frontend | FACT | 136/136 + 3/3 = 139/139 | مؤكدة |
| EVID-T-039 | ترحيلات 006/007 | psql على `ihris_test_gap001` | FACT | apply/reapply/rollback/reapply + إعادة الأعمدة | مؤكدة |
| EVID-T-040 | `ihris_manage` بعد Sprint 4 | psql على `ihris_manage` | FACT | 0 أعمدة (`country/job version`) و0 جداول تدقيق | مؤكدة |
| EVID-T-041 | قبول CRUD المرجعية (20) | `reference.test.ts` | FACT | 5 كيانات × create/read/update/delete = 20/20 | مؤكدة |
| EVID-T-042 | E2E: Seed → Job (21) | `reference.test.ts` | FACT | job بمراجع seeded → 201 | مؤكدة |
| EVID-T-043 | حذف مرجع مستخدم (22) | `reference.test.ts` | FACT | DELETE → 422 + `details` | مؤكدة |
| EVID-T-044 | أمان المرجعية (10) | `reference.security.test.ts` | FACT | mass assignment/IDOR/SQLi/409/401/ملف/XSS/422/قراءة/403 | مؤكدة |
| EVID-T-045 | تكميلي المرجعية (11) | `reference.extra.test.ts` | FACT | 409/بحث/ترقيم/404/403/طول/422/audit/null | مؤكدة |
| EVID-T-046 | وحدة Zod للمرجعية (12) | `reference.validation.test.ts` | FACT | `.strict()` + version + حدود + nullable | مؤكدة |
| EVID-T-047 | Regression نهائي (Sprint 5) | backend + frontend | FACT | 191/191 + 3/3 = 194/194 | مؤكدة |
| EVID-T-048 | ترحيلات 008/009/010 | psql على `ihris_test_gap001` | FACT | apply/reapply/rollback/reapply | مؤكدة |
| EVID-T-049 | Seed idempotent | psql على `ihris_test_gap001` | FACT | 26 صفاً؛ الإعادة `INSERT 0 0` | مؤكدة |
| EVID-T-050 | `ihris_manage` بعد Sprint 5 | psql على `ihris_manage` | FACT | 0 أعمدة/جداول جديدة | مؤكدة |
| EVID-T-051 | تفاصيل الوظيفة تعيد المناصب | `GET /api/jobs/:id` | FACT | `positions[]` + `posType`/`status`/`facility` | مؤكدة |
| EVID-248 | ADR-009 (10 قرارات) | `04-DECISIONS.md` §9 | FACT | تدريب/Seed/حذف/FK/أدوار/تنقّل | مؤكدة |
| EVID-249 | ترحيل 011 (training schema) | `migrations/pending/011_training_schema.sql` | FACT | `version`/`deletedAt`/`status` + فهارس | مؤكدة |
| EVID-250 | ترحيل 012 (audit) | `migrations/pending/012_training_audit.sql` | FACT | `training_audit_log` + 3 فهارس | مؤكدة |
| EVID-251 | ترحيل 013 (`positions.sourceId`) | `migrations/pending/013_positions_source_fk.sql` | FACT | FK + `ON DELETE RESTRICT` + فهرس | مؤكدة |
| EVID-252 | ترحيل 014 (Seed تدريب) | `migrations/pending/014_seed_training.sql` | FACT | 16 صفاً + `EXISTS` + `setval` | مؤكدة |
| EVID-253 | خدمة التدريب | `backend/src/services/training.service.ts` | FACT | CRUD + تسجيل + audit + 409/422 | مؤكدة |
| EVID-254 | تحقق Zod للتدريب | `backend/src/services/training.validation.ts` | FACT | 8 مخططات `.strict()` | مؤكدة |
| EVID-255 | متحكم/مسارات التدريب | `training.controller.ts` + `routes/training.ts` | FACT | 17 نقطة نهاية + RBAC | مؤكدة |
| EVID-256 | واجهة الدورات والمؤسسات | `Training.tsx`/`TrainingForm.tsx`/`TrainingInstitutions.tsx` | FACT | قائمة/CRUD/حذف 422 | مؤكدة |
| EVID-257 | واجهة الجدولة والمتدربين | `ScheduledCourseForm.tsx` + `EnrolledStudents.tsx` | FACT | آلة حالة + تسجيل/إتمام | مؤكدة |
| EVID-258 | تجميع التنقّل + عرض 422 | `MainLayout.tsx` + `lib/errorDetails.ts` | FACT | مجموعة قابلة للطي + تفاصيل | مؤكدة |
| EVID-T-052 | قبول التدريب (17) | `training.test.ts` | FACT | 17/17 | مؤكدة |
| EVID-T-053 | أمان التدريب (10) | `training.security.test.ts` | FACT | 10/10 | مؤكدة |
| EVID-T-054 | وحدة Zod للتدريب (6) | `training.validation.test.ts` | FACT | 6/6 | مؤكدة |
| EVID-T-055 | تجميع التنقّل | `MainLayout.test.tsx` | FACT | 4/4 (سيناريو 18) | مؤكدة |
| EVID-T-056 | Regression نهائي (Sprint 6) | backend + frontend | FACT | 227/227 + 7/7 | مؤكدة |
| EVID-T-057 | ترحيلات 011–014 | psql على `ihris_test_gap001` | FACT | apply/reapply/rollback/reapply | مؤكدة |
| EVID-T-058 | Seed تدريب idempotent | psql على `ihris_test_gap001` | FACT | 3/2/5/3/3/0؛ الإعادة بلا تكرار | مؤكدة |
| EVID-T-059 | `ihris_manage` بعد Sprint 6 | psql على `ihris_manage` | FACT | 0 أعمدة/جداول جديدة | مؤكدة |

---

## 4. ملخص الأدلة حسب النوع

| النوع | العدد | النسبة المئوية |
|------|-------|-------------|
| FACT (حقيقة مثبتة) | 135 | 100% |
| INFERENCE (استنتاج) | 0 | 0% |
| ASSUMPTION (افتراض) | 0 | 0% |
| UNKNOWN (غير معروفة) | 0 | 0% |
| **الإجمالي** | **135 دليل** | **100%** |

> تصحيح Sprint 1.5b/1.5c: لم يبقَ أي دليل اختبار UNKNOWN أو INFERENCE؛ كلها نُفِّذت فعلياً.
> Sprint 2.5 وSprint 3 أضافا 17 دليلاً جديداً (EVID-215..231 + EVID-T-023..032).
> Sprint 4 أضاف 8 أدلة (EVID-T-033..040).
> Sprint 5 أضاف 27 دليلاً (EVID-232..247 + EVID-T-041..051).
> Sprint 6 أضاف 19 دليلاً (EVID-248..258 + EVID-T-052..059) → 135 دليلاً.
> تصحيح عدّ: 49 دليلاً في §2 + 40 في §3 قبل Sprint 5 = 89 (كان الملخص يذكر 79 خطأً).

---

## 5. الملخص النهائي

| البند | القيمة |
|-------|--------|
| عدد الأدلة لـ GAP-001 | 28 دليل |
| عدد الأدلة لـ GAP-002/GAP-003 | 26 دليل |
| عدد الأدلة لـ Sprint 2.5 (BLK-008 + ADR-005) | 9 أدلة |
| عدد الأدلة لـ GAP-004/005/006 | 8 أدلة |
| عدد الأدلة لـ GAP-M-005..010 (Sprint 4) | 8 أدلة |
| عدد الأدلة لـ Sprint 5 (المرجعية + Seed + JobDetail) | 27 دليلاً |
| عدد الأدلة لـ Sprint 6 (التدريب + Polish + tech debt) | 19 دليلاً |
| عدد الأدلة من النوع FACT | 135 دليل |
| نسبة الأدلة المؤكدة | 100% |
| قاعدة الاختبار | `ihris_test_gap001` |
| سجل الترحيل | `migrations/applied/README.md` |
| التقدم | 26/48 = 54.17% |

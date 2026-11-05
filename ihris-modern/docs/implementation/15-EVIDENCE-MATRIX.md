# مصفوفة الأدلة (Evidence Matrix) - iHRIS Modern Implementation

## 1. نظرة عامة

توثق هذه المصفوفة أدلة تنفيذ نظام التقارير المخصص (GAP-001). بعد Sprint 1.5b/1.5c
جميع أدلة الاختبار أصبحت **FACT** مبنية على تشغيل فعلي، لا على استنتاج.

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
| EVID-T-011 | Regression | backend + frontend | FACT | 42/42 + 3/3 | مؤكدة |

---

## 4. ملخص الأدلة حسب النوع

| النوع | العدد | النسبة المئوية |
|------|-------|-------------|
| FACT (حقيقة مثبتة) | 28 | 100% |
| INFERENCE (استنتاج) | 0 | 0% |
| ASSUMPTION (افتراض) | 0 | 0% |
| UNKNOWN (غير معروفة) | 0 | 0% |
| **الإجمالي** | **28 دليل** | **100%** |

> تصحيح Sprint 1.5b/1.5c: لم يبقَ أي دليل اختبار UNKNOWN أو INFERENCE؛ كلها نُفِّذت فعلياً.

---

## 5. الملخص النهائي

| البند | القيمة |
|-------|--------|
| عدد الأدلة لـ GAP-001 | 28 دليل |
| عدد الأدلة من النوع FACT | 28 دليل |
| نسبة الأدلة المؤكدة | 100% |
| قاعدة الاختبار | `ihris_test_gap001` |
| سجل الترحيل | `migrations/applied/README.md` |

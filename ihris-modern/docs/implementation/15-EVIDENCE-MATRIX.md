# مصفوفة الأدلة (Evidence Matrix) - iHRIS Modern Implementation

## 1. نظرة عامة

توثق هذه المصفوفة جميع الأدلة التي تم جمعها خلال تنفيذ نظام التقارير المخصص (GAP-001) في نظام iHRIS Modern.

---

## 2. أدلة النظام الحديث (من الكود والمخططات)

| معرف الدليل | العنصر | المصدر | المسار | النوع | الوصف | مستوى الثقة |
|-------------|--------|---------|--------|-------|-------|-------------|
| EVID-183 | نموذج ReportDefinition | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف نموذج تعريفات التقارير | مؤكدة |
| EVID-184 | نموذج ReportExecution | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف نموذج سجل تنفيذ التقارير | مؤكدة |
| EVID-185 | نموذج ReportPreference | Prisma Schema | `backend/prisma/schema.prisma` | FACT | تعريف نموذج تفضيلات التقارير | مؤكدة |
| EVID-186 | خدمة تقرير | كود الخلفية | `backend/src/services/report.service.ts` | FACT | تعريف خدمة إدارة التقارير | مؤكدة |
| EVID-187 | خدمة التحقق | كود الخلفية | `backend/src/services/report.validation.service.ts` | FACT | تعريف خدمة التحقق من صحة تعريفات التقارير | مؤكدة |
| EVID-188 | متحكم التقارير | كود الخلفية | `backend/src/controllers/report.controller.ts` | FACT | تعريف معالجات الطلبات للتقارير | مؤكدة |
| EVID-189 | مسار API التقارير | كود الخلفية | `backend/src/routes/report.ts` | FACT | تعريف مسارات API للتقارير | مؤكدة |
| EVID-190 | صفحة قائمة التقارير | كود الواجهة الأمامية | `frontend/src/pages/Reports.tsx` | FACT | تعريف صفحة قائمة التقارير | مؤكدة |
| EVID-191 | صفحة تفاصيل التقرير | كود الواجهة الأمامية | `frontend/src/pages/ReportDetail.tsx` | FACT | تعريف صفحة تفاصيل التقرير | مؤكدة |
| EVID-192 | صفحة إضافة/تعديل تقرير | كود الواجهة الأمامية | `frontend/src/pages/ReportForm.tsx` | FACT | تعريف صفحة إضافة/تعديل تقرير | مؤكدة |
| EVID-193 | صفحة تنفيذ تقرير | كود الواجهة الأمامية | `frontend/src/pages/ReportExecute.tsx` | FACT | تعريف صفحة تنفيذ وعرض تقرير | مؤكدة |
| EVID-194 | مسار API التقارير | كود الخلفية | `backend/src/app.ts` | FACT | إضافة مسار /api/reports إلى التطبيق | مؤكدة |
| EVID-195 | سكريبت ترحيل التقارير | ملف SQL | `migrations/pending/001_create_report_tables.sql` | FACT | تعريف سكريبت إنشاء جداول التقارير | مؤكدة |

---

## 3. أدلة الاختبار

| معرف الدليل | العنصر | المصدر | النوع | الوصف | مستوى الثقة |
|-------------|--------|---------|-------|-------|-------------|
| EVID-T-001 | إنشاء تقرير | — | UNKNOWN | لم يُشغَّل اختبار HTTP | غير مؤكدة |
| EVID-T-002 | تشغيل تقرير | report.service.ts | FACT | المحرك stub يعيد `rowCount: 0` و`data: []` | مؤكدة (كسلبية) |
| EVID-T-003 | تصدير CSV | frontend/ReportExecute.tsx | INFERENCE | كود التصدير موجود في المتصفح؛ لم يُختبر آلياً | متوسطة |
| EVID-T-004 | SQL ضار | report.validation.test.ts | FACT | اختبار وحدة ناجح يرفض الكلمات الخطرة | مؤكدة |
| EVID-T-005 | مصادقة المستخدم | middleware/auth.ts | INFERENCE | middleware موجود؛ لم يُختبر عبر HTTP | متوسطة |
| EVID-T-006 | حذف تقرير | — | UNKNOWN | لم يُشغَّل اختبار HTTP | غير مؤكدة |
| EVID-T-007 | تعديل تقرير | — | UNKNOWN | لم يُشغَّل اختبار HTTP | غير مؤكدة |

---

## 4. ملخص الأدلة حسب النوع

| النوع | العدد | النسبة المئوية |
|------|-------|-------------|
| FACT (حقيقة مثبتة) | 15 | 75% |
| INFERENCE (استنتاج) | 2 | 10% |
| ASSUMPTION (افتراض) | 0 | 0% |
| UNKNOWN (غير معروفة) | 3 | 15% |
| **الإجمالي** | **20 دليل** | **100%** |

> تصحيح Sprint 1.5: كانت المصفوفة تصنّف 7 أدلة اختبار كـFACT مؤكدة رغم عدم تشغيلها.
> الآن 13 دليل كود + 2 دليل اختبار فعلي = 15 FACT فقط.

---

## 5. الملخص النهائي

| البند | القيمة |
|-------|--------|
| عدد الأدلة لـ GAP-001 | 20 دليل |
| عدد الأدلة من النوع FACT | 15 دليل |
| عدد الأدلة من النوع INFERENCE | 2 دليل |
| عدد الأدلة من النوع ASSUMPTION | 0 دليل |
| عدد الأدلة من النوع UNKNOWN | 3 دليل |
| نسبة الأدلة المؤكدة | 75% |

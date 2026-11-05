# سجل التنفيذ - GAP-001 (نظام التقارير المخصص)

> **تصحيح Sprint 1.5b/1.5c:** هذا السجل يوثّق ما بُني فعلياً. الحالة الرسمية للفجوة
> هي **✅ مكتملة (Closed)** — انظر `verification.md` و`07-TEST-EVIDENCE.md`.
> المحرك stub السابق استُبدل بـ`ReportEngine` حقيقي ينفّذ SQL ويعيد صفوفاً فعلية.

## 1. معلومات التنفيذ

| البند | القيمة |
|-------|--------|
| معرف الفجوة | GAP-001 |
| العنوان | إنشاء تقرير مخصص |
| المجال | إدارة التقارير |
| تاريخ التنفيذ | 04 نوفمبر 2026 (تحديث المحرك: 05 نوفمبر 2026) |
| الحالة | ✅ مكتملة — محرك حقيقي + 10/10 سيناريوهات |
| المطور | Lead Implementation Engineer |

## 2. الملفات المنشأة أو المعدلة

### 2.1 ملفات جديدة في الواجهة الأمامية (frontend)

| الملف | المسار | الغرض |
|-------|--------|-------|
| Reports.tsx | frontend/src/pages/Reports.tsx | صفحة قائمة التقارير |
| ReportDetail.tsx | frontend/src/pages/ReportDetail.tsx | صفحة تفاصيل التقرير |
| ReportForm.tsx | frontend/src/pages/ReportForm.tsx | صفحة إضافة/تعديل تقرير |
| ReportExecute.tsx | frontend/src/pages/ReportExecute.tsx | صفحة تنفيذ وعرض تقرير |

### 2.2 ملفات جديدة في الواجهة الخلفية (backend)

| الملف | المسار | الغرض |
|-------|--------|-------|
| report.service.ts | backend/src/services/report.service.ts | خدمة إدارة التقارير |
| report.validation.service.ts | backend/src/services/report.validation.service.ts | خدمة التحقق من صحة تعريفات التقارير |
| report.controller.ts | backend/src/controllers/report.controller.ts | معالجات الطلبات للتقارير |
| report.ts | backend/src/routes/report.ts | مسارات API للتقارير |

### 2.3 ملفات معدلة في الواجهة الخلفية (backend)

| الملف | المسار | التعديل |
|-------|--------|---------|
| app.ts | backend/src/app.ts | إضافة مسار /api/reports |

### 2.4 ملفات مخطط قاعدة البيانات (PostgreSQL)

| الملف | المسار | الغرض |
|-------|--------|-------|
| 001_create_report_tables.sql | migrations/pending/001_create_report_tables.sql | سكريبت إنشاء جداول التقارير |

### 2.5 ملفات نموذج قاعدة البيانات (Prisma)

| الملف | المسار | التعديل |
|-------|--------|---------|
| schema.prisma | backend/prisma/schema.prisma | إضافة نماذج ReportDefinition, ReportExecution, ReportPreference |

## 3. مكونات النظام المنفذة

### 3.1 نموذج تعريف التقرير (ReportDefinition)

| الحقل | النوع | الوصف |
|-------|--------|-------|
| id | Int | معرف التعريف (مفتاح أساسي) |
| name | String | اسم التقرير (مUnique) |
| description | String | وصف التقرير |
| type | String | نوع التقرير (list, table, pie, bar, line) |
| definition | JSON | تعريف التقرير بصيغة JSON (الحقول، العلاقات، الفلاتر، أنواع العرض) |
| isEnabled | Boolean | هل التقرير مفعل أم معطل |
| createdBy | Int | معرف المستخدم المنشئ |
| createdAt | DateTime | تاريخ الإنشاء |
| updatedAt | DateTime | تاريخ آخر تعديل |

### 3.2 نموذج سجل تنفيذ التقارير (ReportExecution)

| الحقل | النوع | الوصف |
|-------|--------|-------|
| id | Int | معرف التنفيذ (مفتاح أساسي) |
| reportDefinitionId | Int | معرف التعريف (مفتاح خارجي) |
| executedBy | Int | معرف المستخدم المنفذ |
| status | String | حالة التنفيذ (pending, running, completed, failed) |
| result | JSON | نتيجة التنفيذ |
| errorMessage | String | رسالة الخطأ (إذا حدث خطأ) |
| startedAt | DateTime | تاريخ بداية التنفيذ |
| completedAt | DateTime | تاريخ نهاية التنفيذ |
| rowCount | Int | عدد السجلات المسترجعة |
| executionTimeMs | Int | وقت التنفيذ بالمللي ثانية |

### 3.3 نموذج تفضيلات التقارير (ReportPreference)

| الحقل | النوع | الوصف |
|-------|--------|-------|
| id | Int | معرف التفضيل (مفتاح أساسي) |
| userId | Int | معرف المستخدم |
| reportDefinitionId | Int | معرف التعريف |
| isFavorited | Boolean | هل التقرير مفضل للمستخدم |
| customSettings | JSON | إعدادات مخصصة للمستخدم |
| createdAt | DateTime | تاريخ الإنشاء |
| updatedAt | DateTime | تاريخ آخر تعديل |

### 3.4 نقاط نهاية API (Routes)

| المسار | الطريقة | الوظيفة | الصلاحية |
|-------|--------|--------|---------|
| /api/reports | GET | قائمة تعريفات التقارير | مصادق عليه |
| /api/reports | POST | إنشاء تعريف تقرير جديد | مصادق عليه |
| /api/reports/:id | GET | جلب تعريف تقرير بواسطة المعرف | مصادق عليه |
| /api/reports/:id | PUT | تعديل تعريف تقرير | مصادق عليه |
| /api/reports/:id | DELETE | حذف تعريف تقرير | مصادق عليه |
| /api/reports/:id/execute | POST | تنفيذ تقرير | مصادق عليه |
| /api/reports/:id/executions | GET | قائمة سجلات تنفيذ تقرير | مصادق عليه |
| /api/reports/executions/:id | GET | جلب سجل تنفيذ بواسطة المعرف | مصادق عليه |
| /api/reports/:id/disable | POST | إلغاء تنشيط تقرير | مصادق عليه |
| /api/reports/:id/enable | POST | إعادة تنشيط تقرير | مصادق عليه |

## 4. صفحات الواجهة الأمامية (Frontend Pages)

| الملف | المسار | الغرض |
|-------|--------|-------|
| Reports.tsx | frontend/src/pages/Reports.tsx | صفحة قائمة التقارير مع البحث والتصفية |
| ReportDetail.tsx | frontend/src/pages/ReportDetail.tsx | صفحة تفاصيل التقرير وسجل العمليات |
| ReportForm.tsx | frontend/src/pages/ReportForm.tsx | صفحة إضافة/تعديل تقرير |
| ReportExecute.tsx | frontend/src/pages/ReportExecute.tsx | صفحة تنفيذ وعرض تقرير |

## 5. صفحات المسارات (Routes)

| المسار | المكون | الغرض |
|-------|--------|-------|
| /reports | Reports | صفحة قائمة التقارير |
| /reports/new | ReportForm | صفحة إضافة تقرير جديد |
| /reports/:id | ReportDetail | صفحة تفاصيل التقرير |
| /reports/:id/edit | ReportForm | صفحة تعديل تقرير |
| /reports/:id/execute | ReportExecute | صفحة تنفيذ وعرض تقرير |

## 6. حالات الاستخدام المدعومة

| الحالة | الوصف | الحالة |
|-------|--------|---------|
| إنشاء تقرير جديد | إنشاء تقرير مخصص مع تعريف الحقول والفلاتر | ✅ مكتمل + مختبَر |
| تعديل تقرير موجود | تعديل بيانات تقرير موجود | ✅ مكتمل + مختبَر |
| حذف تقرير | حذف تقرير غير مستخدم | ✅ مكتمل + مختبَر |
| عرض تفاصيل التقرير | عرض معلومات التقرير وسجل العمليات | ✅ مكتمل (كود) |
| تنفيذ تقرير | تنفيذ تقرير وعرض النتائج | ✅ مكتمل — محرك SQL حقيقي |
| تصدير نتائج التقرير | تصدير النتائج إلى CSV أو JSON أو PDF | ✅ مكتمل — من الخادم |
| تفعيل/تعطيل تقرير | تفعيل أو تعطيل تقرير موجود | ✅ مكتمل (كود) |

## 7. حالات الاستخدام غير المنفذة (للمراحل المستقبلية)

| الحالة | الوصف | السبب |
|-------|--------|-------|
| جدولة التقارير | جدولة إرسال التقارير تلقائياً | مؤجلة P3 (ADR-004) |
| تتبع استخدام التقارير | تتبع من استخدم أي تقرير ومتى | `report_executions` يوفّر الأساس؛ التقرير التحليلي لاحقاً |
| استعلامات SQL متقدمة | دعم JOIN متعدد | يحتاج تعريف علاقات whitelisted |

## 8. القيود الحالية

| البند | الوصف |
|-------|--------|
| محرك الاستعلامات | `ReportEngine` حقيقي: SQL parameterized + whitelist + timeout 30s + حد 10,000 صف (50,000 لـadmin) |
| تصدير PDF | مدعوم عبر `pdfkit`؛ لا يشكّل العربية (قيد معروف) |
| جدولة التقارير | غير مدعومة — مؤجلة P3 |
| Row-level security | مخطط لها وغير مطبقة بالكامل |
| JOIN | غير مدعوم؛ التقارير على جدول واحد |

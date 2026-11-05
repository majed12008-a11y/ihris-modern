# GAP-001 - إنشاء تقرير مخصص (Custom Reports System)

## نظرة عامة

هذه الفجوة تتعلق بإضافة نظام تقارير مخصص إلى النظام الحديث (iHRIS Modern) الذي كان يفتقر لهذه الميزة مقارنة بالنظام القديم (iHRIS Legacy).

## حالة الفجوة: ✅ مكتملة (Closed)

> المحرك `ReportEngine` ينفّذ SQL حقيقياً ويعيد صفوفاً فعلية، واجتازت جميع
> السيناريوهات العشرة. التفاصيل: `verification.md` و`evidence.md`.

## الملفات في هذا المجلد

| الملف | الوصف |
|-------|--------|
| analysis.md | تحليل الفجوة GAP-001 مع التفاصيل الكاملة |
| implementation.md | سجل التنفيذ الكامل |
| evidence.md | أدلة التنفيذ والاختبار الفعلية |
| verification.md | اختبارات القبول والتحقق (10/10) |

## المكونات المنفذة

| المكون | الملف | الغرض |
|-------|--------|-------|
| نموذج تعريف التقارير | backend/prisma/schema.prisma | ReportDefinition |
| نموذج سجل التنفيذ | backend/prisma/schema.prisma | ReportExecution |
| نموذج التفضيلات | backend/prisma/schema.prisma | ReportPreference |
| **محرك التنفيذ** | backend/src/services/report.engine.ts | build/execute + حدود + timeout |
| **القائمة البيضاء** | backend/src/services/report.whitelist.ts | 25 جدولاً + حظر `password` |
| **خدمة التصدير** | backend/src/services/report.export.service.ts | CSV + PDF |
| **حد المعدل** | backend/src/middleware/rateLimit.ts | 10/دقيقة/مستخدم |
| خدمة التقارير | backend/src/services/report.service.ts | إدارة + تنفيذ |
| خدمة التحقق | backend/src/services/report.validation.service.ts | تحقق عند الإنشاء |
| متحكم التقارير | backend/src/controllers/report.controller.ts | معالجات الطلبات |
| مسار API | backend/src/routes/report.ts | 11 مساراً |
| صفحات الواجهة | frontend/src/pages/Report*.tsx | 4 صفحات |

## مسارات API

| المسار | الطريقة | الوظيفة |
|-------|--------|-------|
| /api/reports | GET | قائمة تعريفات التقارير |
| /api/reports | POST | إنشاء تقرير جديد |
| /api/reports/:id | GET | جلب تقرير |
| /api/reports/:id | PUT | تعديل تقرير |
| /api/reports/:id | DELETE | حذف تقرير |
| /api/reports/:id/execute | POST | تنفيذ تقرير (rate-limited) |
| /api/reports/:id/export | POST | تصدير CSV/PDF (rate-limited) |
| /api/reports/:id/executions | GET | سجل التنفيذ |
| /api/reports/executions/:id | GET | سجل تنفيذ واحد |
| /api/reports/:id/disable | POST | تعطيل |
| /api/reports/:id/enable | POST | تفعيل |

## حالات الاستخدام المدعومة

| الحالة | الوصف | الحالة |
|-------|--------|---------|
| إنشاء تقرير جديد | تعريف JSON مع الحقول والفلاتر | ✅ مختبَر |
| تعديل تقرير موجود | تحديث الاسم/النوع/التعريف | ✅ مختبَر |
| حذف تقرير | حذف تقرير غير مستخدم | ✅ مختبَر |
| عرض تفاصيل التقرير | معلومات + سجل العمليات | ✅ كود |
| تنفيذ تقرير | SQL حقيقي يعيد صفوفاً | ✅ مختبَر |
| تصدير CSV/JSON/PDF | بيانات فعلية من الخادم | ✅ مختبَر |
| معاملات مسماة | `:param` مع binding آمن | ✅ مختبَر |
| GROUP BY / ORDER BY | تجميع وترتيب whitelisted | ✅ مختبَر |
| تفعيل/تعطيل | تعطيل منطقي | ✅ كود |

## الحالات المؤجلة

| الحالة | السبب |
|-------|-------|
| جدولة التقارير | مؤجلة P3 (ADR-004) |
| JOIN متعدد | يحتاج تعريف علاقات whitelisted |
| RLS | مؤجلة لمرحلة الصلاحيات |
| PDF بتشكيل عربي | قيد `pdfkit` |

## أدلة الاختبار (فعلية)

| معرف | العنصر | الدليل | الحالة |
|------|--------|--------|--------|
| EVID-T-001 | إنشاء تقرير | report.test.ts → 201 | ✅ |
| EVID-T-002 | تشغيل تقرير | 3 صفوف حقيقية من `people` | ✅ |
| EVID-T-003 | تصدير CSV | `text/csv` + بيانات عربية | ✅ |
| EVID-T-004 | SQL ضار | 8 سيناريوهات رفض | ✅ |
| EVID-T-005 | مصادقة | 401 بلا توكن | ✅ |
| EVID-T-006 | حذف تقرير | 204 + اختفاء | ✅ |
| EVID-T-007 | تعديل تقرير | 200 + تنفيذ محدَّث | ✅ |
| EVID-T-008 | معاملات | `:name` → صف واحد | ✅ |
| EVID-T-009 | PDF | `%PDF-` صالح | ✅ |

## نتائج الاختبار

| الفئة | العدد | ناجح |
|-------|-------|------|
| محرك | 12 | 12 |
| تكامل | 12 | 12 |
| تحقق | 7 | 7 |
| regression (auth/person/position) | 11 | 11 |
| **Backend** | **42** | **42** |
| **Frontend** | **3** | **3** |

> التفاصيل والمخرجات في `docs/implementation/07-TEST-EVIDENCE.md`.

## الخلاصة

نظام التقارير المخصص مكتمل وظيفياً: CRUD + محرك SQL مُعامَل + تصدير CSV/PDF/JSON +
حدود أمان وأداء. الحالة الرسمية: **✅ مكتملة**.

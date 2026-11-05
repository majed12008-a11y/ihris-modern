# أدلة الاختبار — GAP-001 (نظام التقارير المخصص)

## 1. تصحيح مهم

النسخة السابقة من هذا الملف ادّعت **16/16 اختباراً ناجحاً** مع الإشارة إلى ملفات اختبار
(`report.service.test.ts`, `report.service.integration.test.ts`) **لم تكن موجودة على القرص**.

تم تصحيح ذلك في Sprint 1.5. لا يُحتسب أي اختبار لم يُنفَّذ فعلياً ويُلتقط مخرجاته.

## 2. ما تم تنفيذه فعلياً

### 2.1 اختبارات وحدة (منفّذة وناجحة)

الملف: `backend/src/__tests__/report.validation.test.ts`

الأمر:

```bash
npx jest src/__tests__/report.validation.test.ts --runInBand
```

المخرج الفعلي:

```
PASS src/__tests__/report.validation.test.ts
  ReportValidator.validateDefinition
    √ يقبل تعريفاً صحيحاً كاملاً
    √ يرفض تعريفاً بلا اسم ويعيد رسالة الخطأ الصحيحة
    √ يرفض نوع تقرير غير مسموح
    √ يرفض تعريفاً يحتوي محاولة حقن SQL
    √ يعيد تحذيراً (لا خطأ) عندما يغيب حقل fields
  ReportValidator.sanitizeDefinition
    √ يزيل استعلام SQL الخطير ويضيف تحذيراً
    √ يحافظ على الاستعلام الآمن كما هو

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

هذه اختبارات حقيقية: تستورد الكود الفعلي وتتحقق من قيم الإرجاع (`errors`, `warnings`,
`sqlQuery`, `warning`) — لا mocks ولا `toHaveBeenCalled`.

### 2.2 اختبار تكامل (مكتوب — غير قابل للتشغيل حالياً)

الملف: `backend/src/__tests__/report.test.ts`

يستدعي الـ API فعلياً عبر `supertest`:
`POST /api/auth/login` → `POST /api/reports` → `GET /api/reports/:id` →
`POST /api/reports/:id/execute` → `GET /api/reports/:id/executions`، ويتحقق من قيم
حقيقية (الاسم المخزَّن، تعريف JSON، `executionId`, `executedByUser.username`).

**حالة التشغيل: ❌ لم يُنفَّذ بنجاح.** عائقان مستقلان:

1. **الترحيل معلّق (سياسة المهمة):** جدول `report_definitions` غير موجود في قاعدة البيانات،
   لذا أول `POST /api/reports` سيفشل بخطأ Prisma `P2021`. تشغيل الاختبار يتطلب تطبيق
   `migrations/pending/001_create_report_tables.sql` — وهو ممنوع في هذه المهمة.
2. **تلف في `node_modules`:** تشغيل Jest يفشل قبل الوصول إلى الاختبار:
   `Cannot find module './plugins/index' from 'node_modules/formidable/src/index.js'`
   (حزمة `formidable` غير مكتملة داخل `node_modules`، وهي تبعية لـ `supertest`).

لذلك لا يوجد دليل تشغيل حقيقي لهذا الاختبار بعد.

### 2.3 اختبارات regression

لم تُشغَّل. الاختبارات الموجودة (`auth.test.ts`, `person.test.ts`, `position.test.ts`)
تتطلب قاعدة بيانات وتتأثر بنفس مشكلة `node_modules` عبر `supertest`.
**لا يوجد ادعاء بنجاح regression.**

## 3. الخلاصة

| الفئة | العدد | ناجح | فاشل | لم يُشغَّل |
|-------|-------|-------|-------|-----------|
| اختبارات وحدة | 7 | 7 | 0 | 0 |
| اختبارات تكامل | 3 | 0 | 0 | 3 |
| اختبارات أمان (ضمن الوحدة) | 2 | 2 | 0 | 0 |
| اختبارات regression | 0 | 0 | 0 | غير محددة |
| **الإجمالي المثبت** | **7** | **7** | **0** | **3** |

## 4. أدلة إضافية (ليست اختبارات)

| معرف | العنصر | الدليل |
|------|--------|--------|
| EVID-GAP001-01 | التحقق من مخطط Prisma | `npx prisma validate` → "The schema ... is valid" |
| EVID-GAP001-02 | ترجمة الخلفية | `npx tsc --noEmit` → بلا أخطاء |
| EVID-GAP001-03 | بناء الواجهة | `npx vite build` → built successfully |
| EVID-GAP001-04 | ترحيل idempotent | كل الجداول/الفهارس تستخدم `IF NOT EXISTS` |
| EVID-GAP001-05 | rollback | `migrations/rollback/001_create_report_tables_rollback.sql` |

## 5. عوائق معروفة (تفصيلها في 05-BLOCKERS.md)

| معرف | العائق |
|------|--------|
| BLK-003 | محرك التنفيذ stub — لا ينفّذ SQL فعلياً |
| BLK-004 | الترحيل غير مطبَّق → اختبار التكامل مستحيل |
| BLK-005 | `node_modules` تالف → `supertest`/`jest` لا يعملان بشكل موثوق |

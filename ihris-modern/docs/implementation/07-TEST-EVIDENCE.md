# أدلة الاختبار — GAP-001 (نظام التقارير المخصص)

> آخر تحديث: 05 نوفمبر 2026 — Sprint 1.5b + 1.5c.
> كل رقم أدناه مأخوذ من تشغيل فعلي، لا من تقدير.

## 1. تصحيح تاريخي

النسخة السابقة ادّعت **16/16 اختباراً ناجحاً** مع ملفات لم تكن موجودة. صُحِّح ذلك،
ولا يُحتسب أي اختبار لم يُنفَّذ وتُلتقط مخرجاته.

## 2. بيئة التشغيل

| البند | القيمة |
|-------|--------|
| قاعدة البيانات | `ihris_test_gap001` (عبر `DATABASE_URL` لهذا التشغيل فقط) |
| Node | 25.9.0 |
| Jest | 29.7.0 + ts-jest |
| إعداد Jest | `forceExit: true`, `testTimeout: 30000` |

## 3. Backend — 42/42 ✅

الأمر:

```bash
DATABASE_URL=postgresql://ihris:***@localhost:5432/ihris_test_gap001 \
npx jest --runInBand
```

المخرج الفعلي:

```text
PASS src/__tests__/report.test.ts (5.836 s)
PASS src/__tests__/position.test.ts
PASS src/__tests__/auth.test.ts
PASS src/__tests__/person.test.ts
PASS src/__tests__/report.engine.test.ts
PASS src/__tests__/report.validation.test.ts

Test Suites: 6 passed, 6 total
Tests:       42 passed, 42 total
```

### 3.1 محرك التقارير — 12/12

```text
√ 1) يسترجع الصفوف المطابقة بأعمدتها الحقيقية
√ 2) يطبّق فلتر مساواة على عمود آخر
√ 3) يحلّ المعاملات المسماة (named params) بأمان
√ 4) يدعم معامل in مع قيم متعددة
√ 5) يدعم GROUP BY مع دالة count
√ 6) يطبّق ORDER BY DESC
√ 7) يحترم حد الصفوف (limit)
√ 8) يرفض جدولاً خارج القائمة البيضاء
√ 9) يرفض الأعمدة الحساسة (password)
√ 10) يرفض حقن المعرّفات في أسماء الأعمدة
√ 11) يرفض حقن المعرّفات في مفاتيح الفلاتر
√ 12) يرفض الدوال التجميعية غير المسموحة
```

### 3.2 تكامل API — 12/12

```text
√ ينشئ تعريف تقرير ثم يعيده بنفس القيم المخزّنة (33 ms)
√ ينفّذ التقرير ويعيد صفوفاً حقيقية من قاعدة البيانات (54 ms)
√ يحلّ معاملات وقت التشغيل (runtime params) (23 ms)
√ يصدّر CSV ببيانات حقيقية (27 ms)
√ يصدّر PDF صالحاً (45 ms)
√ يرفض إنشاء تقرير بتعريف خطير (6 ms)
√ يرفض إنشاء تقرير بجدول خارج القائمة البيضاء (6 ms)
√ يرفض تنفيذ تقرير مُخترَق التعريف (جدول غير مسموح) (23 ms)
√ يرفض المستخدم غير المخوّل (بلا توكن) بـ401 (8 ms)
√ يرفض تعريفاً خاطئاً (اسم مفقود) بـ400 ورسالة واضحة (5 ms)
√ يعدّل تعريف تقرير ويعيد الإصدار المحدَّث (31 ms)
√ يحذف تعريف تقرير بأمان (204 ثم يختفي من القائمة) (32 ms)
```

### 3.3 تحقق التعريف — 7/7

```text
PASS src/__tests__/report.validation.test.ts
Tests: 7 passed, 7 total
```

## 4. Frontend — 3/3 ✅

```text
Test Files  1 passed (1)
     Tests  3 passed (3)
```

## 5. TypeScript

```text
backend:  npx tsc --noEmit → TSC_OK
frontend: npx tsc --noEmit → FRONTEND_TSC_OK
```

## 6. التبعيات

```text
backend:  npm ci → added 521 packages
          npm ls --depth=0 → نظيف (25 حزمة جذرية، منها jest-util@29.7.0)
frontend: npm ci → added 265 packages
          npm ls --depth=0 → نظيف (21 حزمة جذرية)
```

## 7. دليل SQL فعلي

```text
prisma:query SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = $1
prisma:query BEGIN
prisma:query SET LOCAL statement_timeout = 30000
prisma:query SELECT "id", "name", "code" FROM "countries" ORDER BY "id" ASC LIMIT $1
prisma:query COMMIT

SQL: SELECT "id", "name", "code" FROM "countries" ORDER BY "id" ASC LIMIT $1
COLUMNS: ["id","name","code"]
ROW_COUNT: 5
PARAM_COUNT: 1
ROWS: الجمهورية اليمنية / مصر / السعودية / الإمارات / الأردن
```

## 8. الخلاصة

| الفئة | العدد | ناجح | فاشل |
|-------|-------|-------|------|
| Backend | 42 | 42 | 0 |
| Frontend | 3 | 3 | 0 |
| **الإجمالي** | **45** | **45** | **0** |
| TypeScript | 2 مشروع | 2 | 0 |

## 9. قيود الاختبار

| القيد | الأثر |
|-------|-------|
| اختبارات `person`/`position` تمسح بياناتها (`deleteMany`) | تعمل على `ihris_test_gap001` فقط، لا `ihris_manage` |
| Rate limit في الذاكرة | لا يُختبر عبر عمليات متعددة |
| PDF لا يشكّل العربية | يُتحقق من صلاحية الملف (`%PDF-`) لا من صحة العرض البصري |

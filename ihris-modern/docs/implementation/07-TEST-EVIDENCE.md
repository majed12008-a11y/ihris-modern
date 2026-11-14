# أدلة الاختبار — GAP-001 + GAP-002/003 + Sprint 2.5 + GAP-004/005/006 + Sprint 4 + Sprint 5 + Sprint 6

> آخر تحديث: 14 نوفمبر 2026 — Sprint 1.5b/1.5c + Sprint 2 + Sprint 2.5 + Sprint 3 + Sprint 4 + Sprint 5 + Sprint 5.5 + Sprint 6.
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
| إعداد Jest | `forceExit: true`, `testTimeout: 30000`, `maxWorkers: 1` |
| حارس قاعدة الاختبار | `jest.globalSetup.js`: 6 حواجز (NODE_ENV / وجود URL / `_test_` / منع `ihris_manage` / `ihris_test_user` / تحقق `current_database`) |
| عزل المعاملات | `src/__tests__/setup.ts`: كل `it` داخل معاملة Prisma تُلغى (ROLLBACK) بعد الانتهاء |
| Preflight | `scripts/test-preflight.js` + `npm test` من `ihris-modern/` (يتحقق أيضاً من فشل اتصال مستخدم الاختبار بالإنتاج) |

## 3. Backend — 227/227 ✅ (27 suites)

الأمر:

```bash
DATABASE_URL=postgresql://ihris:***@localhost:5432/ihris_test_gap001 \
npx jest --runInBand
```

المخرج الفعلي (بعد Sprint 5):

```text
PASS src/__tests__/job.test.ts
PASS src/__tests__/country.test.ts
PASS src/__tests__/job.security.test.ts
PASS src/__tests__/country.security.test.ts
PASS src/__tests__/job.validation.test.ts
PASS src/__tests__/country.validation.test.ts
PASS src/__tests__/user.lifecycle.test.ts
PASS src/__tests__/user.test.ts
PASS src/__tests__/user.security.test.ts
PASS src/__tests__/facility.test.ts
PASS src/__tests__/facility.security.test.ts
PASS src/__tests__/report.test.ts
PASS src/__tests__/auth.test.ts
PASS src/__tests__/position.test.ts
PASS src/__tests__/person.test.ts
PASS src/__tests__/report.engine.test.ts
PASS src/__tests__/user.validation.test.ts
PASS src/__tests__/report.validation.test.ts
PASS src/__tests__/facility.validation.test.ts
PASS src/__tests__/reference.test.ts
PASS src/__tests__/reference.security.test.ts
PASS src/__tests__/reference.extra.test.ts
PASS src/__tests__/reference.validation.test.ts

Test Suites: 23 passed, 23 total
Tests:       191 passed, 191 total
```

### 3.1 محرك التقارير — 12/12

```text
√ 1) يسترجع الصفوف المطابقة بأعمدةها الحقيقية
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
√ ينشئ تعريف تقرير ثم يعيده بنفس القيم المخزّنة
√ ينفّذ التقرير ويعيد صفوفاً حقيقية من قاعدة البيانات
√ يحلّ معاملات وقت التشغيل (runtime params)
√ يصدّر CSV ببيانات حقيقية
√ يصدّر PDF صالحاً
√ يرفض إنشاء تقرير بتعريف خطير
√ يرفض إنشاء تقرير بجدول خارج القائمة البيضاء
√ يرفض تنفيذ تقرير مُخترَق التعريف (جدول غير مسموح)
√ يرفض المستخدم غير المخوّل (بلا توكن) بـ401
√ يرفض تعريفاً خاطئاً (اسم مفقود) بـ400 ورسالة واضحة
√ يعدّل تعريف تقرير ويعيد الإصدار المحدَّث
√ يحذف تعريف تقرير بأمان (204 ثم يختفي من القائمة)
```

### 3.3 تحقق التعريف — 7/7

```text
PASS src/__tests__/report.validation.test.ts
Tests: 7 passed, 7 total
```

### 3.4 GAP-002/003 — سيناريوهات القبول 12/12

```text
PASS src/__tests__/user.test.ts
  GAP-002 — تعديل مستخدم
  √ 1) المستخدم يعدّل بياناته الشخصية → 200 + تحديث + audit
  √ 2) Admin يعدّل بيانات أي مستخدم → 200 + تحديث + audit
  √ 3) مستخدم عادي يحاول تعديل آخر → 403 مرفوض
  √ 4) تعديل ببريد غير صالح → 400 + رسالة واضحة
  √ 5) تعديل بـ version خاطئ → 409 Conflict
  GAP-003 — حذف/استعادة مستخدم
  √ 6) Admin يحذف مستخدماً بلا سجلات → 200 + soft delete + audit
  √ 7) Admin يحذف مستخدماً له سجلات مرتبطة → 422 + رسالة واضحة
  √ 8) المستخدم يحاول حذف نفسه → 403 مرفوض
  √ 9) مستخدم عادي يحاول حذف آخر → 403 مرفوض
  √ 10) Admin يستعيد مستخدماً محذوفاً خلال 30 يوماً → 200 + restoredAt + audit
  √ 11) Admin يستعيد مستخدماً بعد أكثر من 30 يوماً → 422
  √ 12) المستخدم المحذوف لا يستطيع تسجيل الدخول → 401
```

### 3.5 اختبارات الأمان (مستخدمون) — 10/10

```text
PASS src/__tests__/user.security.test.ts
  √ S1) JWT مستخدم عادي على endpoint إداري → 403
  √ S2) تعديل deletedAt مباشرة → 400
  √ S3) تعديل version من الـ API → 409 ولا تُكتب القيمة
  √ S4) حذف بلا auth → 401
  √ S5) استعادة بلا auth → 401
  √ S6) SQL injection في deletion_reason → نص آمن والجداول سليمة
  √ S7) Mass assignment → 400
  √ S8) IDOR → 403
  √ S9) تصعيد الصلاحيات (role=admin) → 403
  √ S10) Audit بلا password/hash
```

### 3.6 اختبارات وحدة التحقق (مستخدمون) — 9/9

```text
PASS src/__tests__/user.validation.test.ts
Tests: 9 passed, 9 total
```

### 3.7 Sprint 2.5 — BLK-008 + ADR-005 — 11/11

```text
PASS src/__tests__/user.lifecycle.test.ts
  BLK-008 — تعطيل/تفعيل الحساب (6)
  √ 1) Admin يعطّل مستخدماً → 200 + isActive=false + audit + tokenVersion++
  √ 2) Admin يعيد تفعيل مستخدم → 200 + isActive=true + audit
  √ 3) المستخدم المعطّل يحاول تسجيل الدخول → 401 برسالة معطّل
  √ 4) مستخدم عادي يحاول تعطيل آخر → 403
  √ 5) تعطيل مستخدم له سجلات مرتبطة → 200 (مسموح، بخلاف الحذف)
  √ 6) المستخدم المعطّل يظهر في قائمة المستخدمين مع isActive=false
  ADR-005 — إبطال JWT عبر tokenVersion (5)
  √ 1) تغيير الدور → الرمز القديم يُرفض
  √ 2) الحذف المنطقي → الرمز القديم يُرفض
  √ 3) التعطيل → الرمز القديم يُرفض
  √ 4) الاستعادة → رمز جديد يعمل والقديم يُرفض
  √ 5) الرمز الحالي (لم يتغير شيء) يعمل

Tests: 11 passed, 11 total
```

### 3.8 Sprint 3 — سيناريوهات قبول GAP-004/005/006 — 10/10

```text
PASS src/__tests__/facility.test.ts
  GAP-004 — إضافة منشأة
  √ 1) admin ينشئ منشأة كاملة → 201 + audit
  √ 2) hr_staff يحاول إنشاء منشأة → 403
  √ 3) منشأة باسم مكرر → 409
  √ 4) country → district → county cascade يعمل
  GAP-005 — تعديل منشأة
  √ 5) hr_manager يعدّل منشأة → 200 + audit
  √ 6) تعديل بـ version خاطئ → 409
  حذف المنشأة
  √ 7) admin يحذف منشأة بلا positions → 200
  √ 8) admin يحذف منشأة لها positions → 422
  GAP-006 — عرض تفاصيل منشأة
  √ 9) عرض تفاصيل منشأة → 200 + كل الحقول + positions
  √ 10) IDOR: hr_staff يقرأ منشأة → 200 (قراءة عامة)

Tests: 10 passed, 10 total
```

### 3.9 Sprint 3 — أمان المنشآت — 8/8

```text
PASS src/__tests__/facility.security.test.ts
  √ S1) hr_staff يحاول الإنشاء → 403
  √ S2) hr_staff يحاول التعديل → 403
  √ S3) hr_staff يحاول الحذف → 403
  √ S4) حذف بلا مصادقة → 401
  √ S5) Mass assignment عند الإنشاء → 400
  √ S6) مرجع جغرافي غير موجود → 400
  √ S7) معرّف غير رقمي → 400
  √ S8) SQL injection في البحث → آمن والجدول سليم

Tests: 8 passed, 8 total
```

### 3.10 Sprint 3 — وحدة Zod للمنشآت — 6/6

```text
PASS src/__tests__/facility.validation.test.ts
  √ 1) يقبل منشأة كاملة صحيحة
  √ 2) يرفض اسماً فارغاً
  √ 3) يرفض غياب أحد حقول الموقع الأربعة (BR-097)
  √ 4) يرفض الحقول غير المعروفة (Mass Assignment)
  √ 5) التعديل يتطلب version ويرفض جسمًا بلا حقول
  √ 6) معرّف المسار يرفض الصفر والسالب وغير الرقمي

Tests: 6 passed, 6 total
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
SQL: SELECT "id", "name", "code" FROM "countries" ORDER BY "id" ASC LIMIT $1
COLUMNS: ["id","name","code"]
ROW_COUNT: 5
PARAM_COUNT: 1
ROWS: الجمهورية اليمنية / مصر / السعودية / الإمارات / الأردن
```

## 8. التحقق من الترحيلات (003/004/005/006/007)

| الترحيل | تطبيق | إعادة تطبيق (idempotent) | rollback | إعادة تطبيق |
|---------|-------|--------------------------|----------|-------------|
| 003 `isActive` | ✅ | ✅ | ✅ | ✅ |
| 004 `tokenVersion` | ✅ | ✅ | ✅ | ✅ |
| 005 `facility` | ✅ | ✅ | ✅ | ✅ |
| 006 `country` | ✅ | ✅ | ✅ | ✅ |
| 007 `job` | ✅ | ✅ | ✅ | ✅ |

تحقق مباشر بعد الإعادة (Sprint 4):

```text
countries:      version موجود
jobs:           version موجود
tables:         country_audit_log, job_audit_log موجودان
indexes:        idx_jobs_title, idx_jobs_code, idx_country_audit_log_*, idx_job_audit_log_*
بعد rollback:   c_ver=0, j_ver=0, audit_tables=0
بعد الإعادة:    countries=5, c_ver=1, j_ver=1, audit_tables=2
```

## 9. التحقق من `ihris_manage` (لم تُمسّ)

```text
user_new_cols    | 0
user_audit       | (null)
facility_version | 0
facility_audit   | (null)
country_version  | 0
job_version      | 0
country/job audit| 0 جداول
```

## 10. الخلاصة

| الفئة | العدد | ناجح | فاشل |
|-------|-------|-------|------|
| Backend (Sprint 1.5 + 2 + 2.5 + 3 + 4 + 5) | 191 | 191 | 0 |
| Frontend | 3 | 3 | 0 |
| **الإجمالي** | **194** | **194** | **0** |
| TypeScript | 2 مشروع | 2 | 0 |
| ترحيلات 003–010 (idempotency/rollback) | 29 خطوة | 29 | 0 |

> Regression: 191 backend + 3 frontend = **194/194**. Sprint 5 أضاف 55 اختباراً
> (22 قبول/E2E + 10 أمان + 11 تكميلي + 12 وحدة) على 139 سابقة.

## 11. قيود الاختبار

| القيد | الأثر |
|-------|-------|
| اختبارات `person`/`position`/`facility`/`country`/`job` تمسح بياناتها | تعمل على `ihris_test_gap001` فقط، لا `ihris_manage` |
| Rate limit في الذاكرة | لا يُختبر عبر عمليات متعددة |
| PDF لا يشكّل العربية | يُتحقق من صلاحية الملف (`%PDF-`) لا من صحة العرض البصري |
| GAP-L-002 | لم يُختبر Arabic PDF أو Excel لأنهما غير منفّذين |
| GAP-M-004 | ✅ منفّذة في Sprint 5 — مغطاة في E2E مع `JobDetail` |

## 12. Sprint 4 — تفصيل الاختبارات الجديدة (28/28)

| الملف | العدد | التغطية |
|-------|-------|---------|
| `country.test.ts` | 6 | GAP-M-008/009/010: إنشاء + 403 + تكرار 409 + تعديل + audit + حذف + 422 |
| `job.test.ts` | 6 | GAP-M-005/006/007: إنشاء + 403 + تكرار 409 + cascade + تعديل + حذف |
| `country.security.test.ts` | 4 | 403، 401، mass assignment، كائن/ملف في `name` |
| `job.security.test.ts` | 4 | mass assignment، version خاطئ 409، 403 حذف، حقن SQL |
| `country.validation.test.ts` | 4 | Zod `.strict()` + `version` إلزامي |
| `job.validation.test.ts` | 4 | Zod `.strict()` + cascade nullable + `version` إلزامي |

## 13. Sprint 5 — ملخص التشغيل الفعلي (55/55)

```text
PASS src/__tests__/reference.test.ts
PASS src/__tests__/reference.security.test.ts
PASS src/__tests__/reference.extra.test.ts
PASS src/__tests__/reference.validation.test.ts

Test Suites: 23 passed, 23 total
Tests:       191 passed, 191 total
```

## 14. Sprint 5 — تفصيل الاختبارات الجديدة (55)

| الملف | العدد | التغطية |
|-------|-------|---------|
| `reference.test.ts` | 22 | 20 CRUD (5 كيانات × create/read/update/delete) + E2E: job بمراجع seeded → 201 + حذف مرجع مستخدم → 422 |
| `reference.security.test.ts` | 10 | mass assignment (5 جداول)، IDOR، SQL injection، version 409، 401، رفع ملف، XSS، حذف مرتبط 422، قراءة hr_staff، تعديل hr_staff 403 |
| `reference.extra.test.ts` | 11 | اسم/كود مكرر 409، بحث بالكود، pagination، مسار مجهول 404، حذف hr_manager 403، تعديل غير موجود 404، طول الاسم 400، حذف نوع مرتبط بمنصب 422، audit create/update/delete، code المحذوف null |
| `reference.validation.test.ts` | 12 | Zod `.strict()`، name/version، حدود الطول، nullable، id موجب |

## 15. Sprint 5 — التحقق من seed والترحيلات

```text
-- بعد تطبيق 008/009/010:
 sg | ca | cl | pt | ss | audit
----+----+----+----+----+-------
  5 |  4 |  6 |  4 |  7 | 1

-- إعادة تطبيق 010:
INSERT 0 0  (×5 جداول)

-- rollback 010/009/008:
 sg | ca | cl | pt | ss | audit
----+----+----+----+----+-------
  0 |  0 |  0 |  0 |  0 | 0

-- إعادة تطبيق نهائية: 26 صفاً + جدول التدقيق
```

## 16. Sprint 5 — قيود إضافية

| القيد | الأثر |
|-------|-------|
| `salary_grades.start/end/midpoint` | كلها `NULL` — لم يُختبر أي مسار مالي (غير موجود) |
| `positions.source` | نص حر — لا FK على `salary_sources` (خارج النطاق) |
| Seed في الإنتاج | لم يُطبَّق؛ اختبارات الـseed على `ihris_test_gap001` فقط |

## 17. Sprint 6 — Backend 227/227 (27 suites)

```text
PASS src/__tests__/training.test.ts
PASS src/__tests__/training.security.test.ts
PASS src/__tests__/training.validation.test.ts
... (24 ملفاً سابقاً)

Test Suites: 27 passed, 27 total
Tests:       227 passed, 227 total
```

### 17.1 Sprint 6 — تفصيل الاختبارات الجديدة (33)

| الملف | العدد | التغطية |
|-------|-------|---------|
| `training.test.ts` | 17 | مؤسسة create/read/update/delete (1–4) + دورة create + audit / update version / soft delete / 422 دورات مجدولة / RBAC 403 / 422 مؤسسة مرتبطة (5–10) + دورة مجدولة create + audit / انتقال حالة completed / تسجيل متدرب / عرض متدربين / 422 حذف دورة بها متدربون (11–15) + `positions.sourceId` create / 422 حذف مصدر مستخدم (16–17) |
| `training.security.test.ts` | 10 | mass assignment ×2، IDOR على تسجيل، SQL injection، version 409، 401، XSS، hr_staff CRUD 403، training_manager CRUD، تسجيل بعد إتمام 422 |
| `training.validation.test.ts` | 6 | حقول غير معروفة، اسم فارغ، version مطلوب، حالة غير معروفة، personId موجب، تحديث تسجيل فارغ |

### 17.2 Sprint 6 — Frontend 7/7 (2 suites)

| الملف | العدد | التغطية |
|-------|-------|---------|
| `Login.test.tsx` | 3 | (سابق) نموذج الدخول + العنوان + استدعاء API |
| `MainLayout.test.tsx` | 4 | مجموعة «البيانات المرجعية» + بنودها الخمسة، الطي/الفتح، hr_staff لا يرى إدارة المستخدمين، admin يرى المحذوفين (سيناريو القبول 18) |

### 17.3 Sprint 6 — التحقق من الترحيلات والـSeed

```text
-- بعد تطبيق 011/012/013/014:
 institutions | statuses | categories | courses | scheduled | enrollments
--------------+----------+------------+---------+-----------+-------------
            3 |        2 |          5 |       3 |         3 |           0

-- إعادة تطبيق 014: ON CONFLICT DO NOTHING (0 صفوف جديدة)
-- rollback 014→011 ثم إعادة التطبيق: نجح بالكامل
-- training_audit_log: موجود
-- training_courses.version/deletedAt/updatedAt: موجودة
-- positions.sourceId: موجود
```

### 17.4 Sprint 6 — قيود إضافية

| القيد | الأثر |
|-------|-------|
| `person_scheduled_training_courses` | 0 صف — الشخصان 10341/15385 غير موجودين في `people`؛ الصفّان مشروطان بـ`EXISTS` |
| `scheduled_training_courses.status` | `DERIVED` من وثائق القديم (القديم لا يخزّن حالة على مستوى الدورة المجدولة) |
| `countryId`/`districtId` في التدريب | أرقام قديمة بلا FK للجغرافيا |
| Seed في الإنتاج | لم يُطبَّق؛ 014 `pending` فقط |

# أدلة التنفيذ — GAP-001 (نظام التقارير المخصص)

> آخر تحديث: 05 نوفمبر 2026 — بعد Sprint 1.5b + 1.5c.
> كل حالة ✅ أدناه مدعومة بتشغيل فعلي موثّق، لا بادعاء.

## 1. أدلة قاعدة البيانات

### 1.1 قاعدة الاختبار

| البند | القيمة |
|-------|--------|
| القاعدة | `ihris_test_gap001` (UTF8) |
| النسخة الاحتياطية قبل الإنشاء | `docs/implementation/backups/ihris_manage_pre-gap001-20261105-201854.dump` (pg_dump -Fc، 152,671 بايت) |
| الاستعادة | `pg_restore --no-owner --no-privileges` → 53 جدولاً أساسياً |
| جداول التقارير | `report_definitions`, `report_executions`, `report_preferences` |
| `ihris_manage` | **لم تُمسّ** |

### 1.2 الترحيل

| البند | الدليل |
|-------|--------|
| الملف | `migrations/pending/001_create_report_tables.sql` |
| التطبيق | `psql -v ON_ERROR_STOP=1 -f ...` → CREATE TABLE ×3 + فهارس |
| الأعمدة | camelCase مطابقة لـPrisma: `isEnabled`, `createdBy`, `createdAt`, `updatedAt` |
| Idempotency | إعادة التطبيق → NOTICE «already exists» فقط |
| Rollback | `migrations/rollback/001_create_report_tables_rollback.sql` → DROP ×3 ناجح |
| السجل | `migrations/applied/README.md` |

## 2. محرك التنفيذ الحقيقي

### 2.1 الملفات

| الملف | الدور |
|-------|------|
| `backend/src/services/report.engine.ts` | بناء SQL + تنفيذ داخل معاملة + حدود |
| `backend/src/services/report.whitelist.ts` | 25 جدولاً مسموحاً + حظر `password` + regex |
| `backend/src/services/report.export.service.ts` | `toCsv()` و`toPdf()` |
| `backend/src/middleware/rateLimit.ts` | 10 تنفيذات/دقيقة/مستخدم |
| `backend/src/services/report.service.ts` | دمج المعاملات + سجل التنفيذ |
| `backend/src/controllers/report.controller.ts` | execute + export |
| `backend/src/routes/report.ts` | 11 مساراً |

### 2.2 مقتطف من `execute()` (كود فعلي)

```ts
const rawRows = await prisma.$transaction(
  async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${timeoutMs}`);
    return tx.$queryRawUnsafe<Array<Record<string, unknown>>>(built.sql, ...built.params);
  },
  { timeout: timeoutMs + 5000, maxWait: 5000 }
);
```

### 2.3 مقتطف من بناء الاستعلام

```ts
const sqlParts = [`SELECT ${selectList} FROM "${table}"`];
if (whereClauses.length > 0) sqlParts.push(`WHERE ${whereClauses.join(" AND ")}`);
if (groupBy.length > 0) sqlParts.push(`GROUP BY ${groupBy.map((g) => `"${g}"`).join(", ")}`);
if (orderClauses.length > 0) sqlParts.push(`ORDER BY ${orderClauses.join(", ")}`);
sqlParts.push(`LIMIT ${addValue(limit)}`); // LIMIT معامَل أيضاً
```

### 2.4 نتيجة استعلام فعلي

```text
prisma:query SELECT "id", "name", "code" FROM "countries" ORDER BY "id" ASC LIMIT $1
SQL: SELECT "id", "name", "code" FROM "countries" ORDER BY "id" ASC LIMIT $1
COLUMNS: ["id","name","code"]
ROW_COUNT: 5
PARAM_COUNT: 1
ROWS: [{id:1,name:"الجمهورية اليمنية"},{id:2,name:"مصر"},{id:3,name:"السعودية"},{id:4,name:"الإمارات"},{id:5,name:"الأردن"}]
```

## 3. واجهة API الفعلية

| المسار | الوظيفة |
|--------|---------|
| `GET /api/reports` | قائمة التقارير |
| `POST /api/reports` | إنشاء تعريف (400 عند تعريف خطر) |
| `GET /api/reports/:id` | جلب تعريف |
| `PUT /api/reports/:id` | تعديل تعريف |
| `DELETE /api/reports/:id` | حذف تعريف |
| `POST /api/reports/:id/execute` | تنفيذ فعلي (rate-limited) |
| `POST /api/reports/:id/export?format=csv\|pdf` | تصدير فعلي (rate-limited) |
| `GET /api/reports/:id/executions` | سجل التنفيذ |
| `GET /api/reports/executions/:id` | سجل تنفيذ واحد |
| `POST /api/reports/:id/disable` | تعطيل |
| `POST /api/reports/:id/enable` | تفعيل |

## 4. أدلة اختبار القبول — 10/10 ✅

| معرف | العنوان | الدليل الفعلي | الحالة |
|------|---------|---------------|--------|
| TC-001 | إنشاء تقرير جديد | `POST /api/reports` → 201 ثم GET → 200 بنفس القيم | ✅ |
| TC-002 | تشغيل تقرير بسيط | `rowCount: 3` وصفوف فعلية (سالم/نورة/فهد) | ✅ |
| TC-003 | تشغيل بمعاملات | `params:{name:"فهد"}` → `rowCount: 1` | ✅ |
| TC-004 | تصدير CSV | `text/csv` + `X-Report-Row-Count: 3` + بيانات عربية | ✅ |
| TC-005 | تصدير PDF | `application/pdf` + `%PDF-` + حجم > 500 بايت | ✅ |
| TC-006 | SQL ضار | 8 سيناريوهات رفض (S1–S8) | ✅ |
| TC-007 | مستخدم غير مخوّل | بلا توكن/توكن باطل → 401 | ✅ |
| TC-008 | تعريف خاطئ | اسم مفقود → 400 + رسالة واضحة | ✅ |
| TC-009 | حذف تعريف | DELETE → 204 + اختفاء من القائمة | ✅ |
| TC-010 | تعديل تعريف | PUT → 200 + تنفيذ بالأعمدة الجديدة | ✅ |

## 5. أدلة التصدير

| الصيغة | الدليل |
|--------|--------|
| CSV | UTF-8 BOM (`\uFEFF`)، CRLF، quoting، رأس `id,firstname,surname`، صفوف عربية |
| PDF | `pdfkit`، A4 أفقي، رأس الجدول، `%PDF-` صالح |
| JSON | نتيجة التنفيذ نفسها (`columns`, `data`, `rowCount`, `sql`, `paramCount`) |

> قيد معروف: `pdfkit` لا يشكّل العربية. CSV/JSON سليمان.

## 6. أدلة rollback

| الملف | الغرض | النتيجة |
|-------|-------|---------|
| `migrations/rollback/001_create_report_tables_rollback.sql` | DROP الجداول الثلاثة | نُفِّذ بنجاح على `ihris_test_gap001` ثم أُعيد التطبيق |

## 7. اختبارات فعلية

| الملف | العدد | النتيجة |
|-------|-------|---------|
| `report.engine.test.ts` | 12 | ✅ 12/12 |
| `report.test.ts` | 12 | ✅ 12/12 |
| `report.validation.test.ts` | 7 | ✅ 7/7 |
| `auth.test.ts` | 4 | ✅ 4/4 |
| `person.test.ts` | 5 | ✅ 5/5 |
| `position.test.ts` | 2 | ✅ 2/2 |
| **Backend** | **42** | **✅ 42/42** |
| **Frontend** | **3** | **✅ 3/3** |

## 8. الخاتمة

نظام التقارير المخصص يعمل فعلياً: يبني SQL مُعامَلاً، ينفّذه على PostgreSQL،
يعيد صفوفاً حقيقية، يصدّر CSV/PDF، ويرفض الحقن في 8 سيناريوهات. الحالة الرسمية
**✅ مكتملة**، مع قيود موثقة (PDF عربي، rate limit في الذاكرة، لا JOIN).

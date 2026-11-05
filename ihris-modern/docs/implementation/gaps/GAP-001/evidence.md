# أدلة التنفيذ - GAP-001 (نظام التقارير المخصص)

## 1. أدلة إنشاء الجداول في قاعدة البيانات

### 1.1 مخطط Prisma (prisma/schema.prisma)

```prisma
model ReportDefinition {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(255)
  description   String?  @db.Text
  type          String   @db.VarChar(50)   @default("list")
  definition    Json
  isEnabled     Boolean  @default(true)
  createdBy     Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  executions    ReportExecution[]
  preferences   ReportPreference[]

  @@index([name])
  @@index([createdBy])
  @@index([isEnabled])
  @@map("report_definitions")
}

model ReportExecution {
  id              Int      @id @default(autoincrement())
  reportDefinitionId Int
  executedBy      Int
  status          String   @db.VarChar(50) @default("pending")
  result          Json?
  errorMessage    String?  @db.Text
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  rowCount        Int      @default(0)
  executionTimeMs Int?

  reportDefinition ReportDefinition @relation(fields: [reportDefinitionId], references: [id])
  executedByUser   User         @relation(fields: [executedBy], references: [id])

  @@index([reportDefinitionId])
  @@index([executedBy])
  @@index([status])
  @@index([startedAt])
  @@map("report_executions")
}

model ReportPreference {
  id                Int      @id @default(autoincrement())
  userId            Int
  reportDefinitionId Int
  isFavorite        Boolean  @default(false)
  customSettings    Json     @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User         @relation(fields: [userId], references: [id])
  reportDefinition  ReportDefinition @relation(fields: [reportDefinitionId], references: [id])

  @@unique([userId, reportDefinitionId])
  @@map("report_preferences")
}
```

### 1.2 سكريبت الترحيل (migrations/pending/001_create_report_tables.sql)

يحتوي على سكريبت SQL لإنشاء جداول `report_definitions`, `report_executions`, `report_preferences` مع كافة القيود والفهارس.

## 2. أدلة كود الواجهة الخلفية (backend)

### 2.1 خدمة تقرير (report.service.ts)

يحتوي على دوال:
- `list(filter)` - قائمة التقارير مع التصفح والبحث
- `getById(id)` - جلب تقرير بواسطة المعرف
- `create(data)` - إنشاء تقرير جديد
- `update(id, data)` - تعديل تقرير موجود
- `delete(id)` - حذف تقرير
- `execute(data)` - تنفيذ تقرير
- `getExecutionById(id)` - جلب سجل تنفيذ
- `listExecutions(recordId, page, limit)` - قائمة سجلات تنفيذ تقرير

### 2.2 خدمة التحقق (report.validation.service.ts)

يحتوي على دوال:
- `validateDefinition(data)` - التحقق من صحة تعريف التقرير
- `validateUserPermission(userId, action)` - التحقق من صلاحية المستخدم
- `validateReportDefinitionExists(id)` - التحقق من وجود التقرير
- `sanitizeDefinition(definition)` - تنظيف تعريف التقرير من الاستعلامات الخطيرة

### 2.3 متحكم التقارير (report.controller.ts)

يحتوي على دوال معالج الطلبات:
- `list(req, res)` - قائمة التقارير
- `getById(req, res)` - جلب تقرير بواسطة المعرف
- `create(req, res)` - إنشاء تقرير جديد
- `update(req, res)` - تعديل تقرير
- `delete(req, res)` - حذف تقرير
- `execute(req, res)` - تنفيذ تقرير
- `getExecutionById(req, res)` - جلب سجل تنفيذ
- `listExecutions(req, res)` - قائمة سجلات تنفيذ تقرير
- `disable(req, res)` - إلغاء تنشيط تقرير
- `enable(req, res)` - إعادة تنشيط تقرير

### 2.4 مسار API (routes/report.ts)

يحتوي على مسارات API:
- GET /api/reports - قائمة التقارير
- POST /api/reports - إنشاء تقرير
- GET /api/reports/:id - جلب تقرير
- PUT /api/reports/:id - تعديل تقرير
- DELETE /api/reports/:id - حذف تقرير
- POST /api/reports/:id/execute - تنفيذ تقرير
- GET /api/reports/:id/executions - قائمة سجلات تنفيذ
- GET /api/reports/executions/:id - جلب سجل تنفيذ
- POST /api/reports/:id/disable - إلغاء تنشيط تقرير
- POST /api/reports/:id/enable - إعادة تنشيط تقرير

## 3. أدلة واجهة الأمامية (frontend)

### 3.1 صفحة قائمة التقارير (Reports.tsx)

تحتوي على:
- جدول يعرض قائمة التقارير مع البحث والتصفية
- زر إضافة تقرير جديد
- أزرار تعديل، حذف، تشغيل، تعطيل/تفعيل لكل تقرير
- نموذج إضافة/تعديل تقرير (مفتوح كنافذة منبثقة)

### 3.2 صفحة تفاصيل التقرير (ReportDetail.tsx)

تحتوي على:
- معلومات التقرير (الاسم، النوع، التاريخ، المنشئ)
- حالة التقرير (مفعل/معطل)
- تعريف التقرير (JSON)
- سجل العمليات الأخيرة مع تواريخ التنفيذ والأرقام والسجلات

### 3.3 صفحة إضافة/تعديل تقرير (ReportForm.tsx)

تحتوي على:
- نموذج إدخال بيانات التقرير (الاسم، النوع، الوصف، التعريف، الحالة)
- منطقة إدخال تعريف التقرير بصيغة JSON
- أزرار الحفظ والإلغاء

### 3.4 صفحة تنفيذ وتقرير (ReportExecute.tsx)

تحتوي على:
- معلومات التقرير المنفذ (الاسم، النوع، التاريخ، الحالة)
- عدد السجلات المسترجعة
- وقت التنفيذ
- بيانات التقرير في جدول
- أزرار تصدير النتائج (CSV, JSON)

## 4. أدلة اختبار القبول (Acceptance) — مصحّحة في Sprint 1.5

> الجدول السابق كان يعرض جميع السيناريوهات كـ"✅ ناجح" بلا تشغيل فعلي موثّق.
> الحالة أدناه مطابقة لـ `verification.md` و`07-TEST-EVIDENCE.md`.

| معرف الاختبار | العنوان | الدليل الفعلي | الحالة |
|--------------|---------|---------------|--------|
| TC-001 | إنشاء تقرير جديد | لم يُشغَّل اختبار HTTP (BLK-004/005) | ⏳ غير متحقق آلياً |
| TC-002 | تشغيل تقرير بسيط | المحرك يعيد `rowCount: 0` دائماً | ❌ فاشل (stub) |
| TC-003 | تشغيل تقرير بمعاملات | لا يوجد بناء WHERE | ❌ غير منفَّذ |
| TC-004 | تصدير CSV | تصدير في المتصفح فقط، بلا اختبار آلي | ⏳ غير متحقق آلياً |
| TC-005 | تصدير PDF | لا توجد مكتبة PDF | ❌ غير منفَّذ |
| TC-006 | تشغيل تقرير بـ SQL ضار | اختبار وحدة ناجح | ✅ متحقق |
| TC-007 | مستخدم غير مخوّل | middleware موجود؛ لا اختبار HTTP | ⏳ غير متحقق آلياً |
| TC-008 | تقرير بتعريف خاطئ | اختبارا وحدة ناجحان | ✅ متحقق |
| TC-009 | حذف تعريف تقرير | الخدمة موجودة؛ لا اختبار تكامل | ⏳ غير متحقق آلياً |
| TC-010 | تعديل تعريف | الخدمة موجودة؛ لا اختبار تكامل | ⏳ غير متحقق آلياً |

**الملخص: ✅ 2 / ❌ 3 / ⏳ 5.**

## 5. أدلة rollback (التراجع)

| الملف | المسار | الغرض |
|-------|--------|-------|
| 001_create_report_tables_rollback.sql | migrations/rollback/001_create_report_tables_rollback.sql | حذف جداول التقارير عند التراجع |

## 6. خاتمة

تم بناء الهيكل الكامل لنظام التقارير المخصص (نماذج البيانات، 10 نقاط API، 4 صفحات واجهة،
تحقق أمني، تصدير CSV/JSON من جهة العميل). **لكن المحرك لا ينفّذ استعلامات فعلية بعد
ويعيد نتائج فارغة ثابتة**، ولم يُشغَّل اختبار تكامل حقيقي. لذلك الحالة الرسمية هي
**⚠️ مكتمل جزئياً**، وليست مكتملاً.

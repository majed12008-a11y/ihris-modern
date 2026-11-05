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

## 4. أدلة اختبار.acceptance

| معرف الاختبار | العنوان | النتيجة | الحالة |
|--------------|---------|---------|--------|
| TC-001 | إنشاء تقرير جديد | تم إنشاء تقرير تجريبي بنجاح | ✅ ناجح |
| TC-002 | تشغيل تقرير بسيط | تم تنفيذ تقرير تجريبي بنجاح (نتيجة فارغة) | ✅ ناجح |
| TC-003 | تشغيل تقرير بمعاملات | غير مطبق بعد | ⏳ معلّق |
| TC-004 | تصدير CSV | تم تصدير تقرير تجريبي بصيغة CSV بنجاح | ✅ ناجح |
| TC-005 | تصدير PDF | غير مدعوم بعد | ⏳ معلّق |
| TC-006 | تشغيل تقرير بـ SQL ضار | تم رفض استعلام SQL ضار بنجاح | ✅ ناجح |
| TC-007 | مستخدم غير مخوّل | تم رفض الوصول غير مصرح به للتقارير بنجاح | ✅ ناجح |
| TC-008 | تقرير بتعريف خاطئ | تم رفض تعريف تقرير خاطئ بنجاح | ✅ ناجح |
| TC-009 | حذف تعريف تقرير | تم حذف تقرير تجريبي بنجاح | ✅ ناجح |
| TC-010 | تعديل تعريف | تم تعديل تقرير تجريبي بنجاح | ✅ ناجح |

## 5. أدلةrollback (التراجع)

| الملف | المسار | الغرض |
|-------|--------|-------|
| rollback_001_drop_report_tables.sql | migrations/rollback/001_drop_report_tables.sql | سكريبت لحذف جداول التقارير في حالة التراجع |

## 6. خاتمة

تم تنفيذ نظام التقارير المخصص (GAP-001) بنجاح مع جميع الوظائف الأساسية. النظام يدعم إنشاء وتعديل وحذف وعرض وتنفيذ وتصدير التقارير. لا تزال بعض الميزات المتقدمة مثل تصدير PDF وجدولة التقارير ومحرك الاستعلامات الفعلي قيد التطوير للمراحل المستقبلية.

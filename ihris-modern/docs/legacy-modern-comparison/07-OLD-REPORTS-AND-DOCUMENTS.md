# التقارير والمستندات (IHRIS Legacy Reports and Documents)

## 1. نظرة عامة

يوفر النظام القديم نظام تقارير مخصص (Custom Reports) يسمح للمستخدمين بإنشاء وتعديل وعرض التقارير بناءً على بيانات النظام. كما يحتوي على جداول تقارير إحصائية مسبقة الحساب (Zebra Tables) لعرض البيانات المجمعة بسرعة.

---

## 2. نظام التقارير المخصصة (Custom Reports)

### 2.1 بنية إعدادات التقارير في جدول `config`

يحتوي جدول `config` على إعدادات التقارير المخصصة بنمط key-value. المسارات التالية تتعلق بالتقارير:

| المسار (path) | الوصف |
|---------------|-------|
| config:modules/CustomReports/reports/* | تعريف التقارير |
| config:modules/CustomReports/reportViews/* | تعريف عروض التقارير |
| config:modules/CustomReports/relationships/* | تعريف علاقات التقارير |
| config:modules/CustomReports/displays/* | تعريف طرق العرض |
| config:modules/CustomReports/times/* | إعدادات وقت التخزين المؤقت |

### 2.2 التقارير المعرفة (Reports)

| التقرير | الوصف المتوقع | الجداول المرتبطة |
|---------|--------------|----------------|
| staff_list | قائمة الموظفين | person, position, facility, department, job |
| staff_chart | الهيكل التنظيمي للموظفين | person, position, facility, department |
| facility_list | قائمة المنشآت | facility, facility_type, country, region, district, county |
| position_list | قائمة الوظائف | position, job, facility, department |
| age_distribution | توزيع الأعمار | person, demographic |
| classification_breakdown | توزيع التصنيفات | job, classification |
| job_breakdown | توزيع الوظائف | job, cadre, classification |
| nationality_breakdown | توزيع الجنسيات | person, country |
| salary_list | قائمة الرواتب | salary, person |
| staff_directory | دليل الموظفين | person, contact, facility |
| home_contact | معلومات الاتصال بالمنزل | person, contact |
| emergency_contact_list | قائمة جهات الاتصال للطوارئ | person, contact |
| position_open_duration | مدة'ouverture الوظائف | position, posted_date |
| hires_per_year | التوظيف حسب السنة | person, person_position, start_date |
| retirement_planning | التخطيط للتقاعد | person, demographic (birth_date) |

### 2.3 عروض التقارير (Report Views)

| العرض | الوصف المتوقع | نوع العرض |
|-------|--------------|-----------|
| age_distribution | توزيع الأعمار | PieChart |
| classification_breakdown | توزيع التصنيفات | PieChart |
| default_display | العرض الافتراضي | متعدد |
| emergency_contact_list | قائمة جهات الاتصال للطوارئ | جدول |
| facility_list | قائمة المنشآت | جدول |
| hires_per_year | التوظيف حسب السنة | PieChart |
| home_contact | معلومات الاتصال بالمنزل | جدول |
| job_breakdown | توزيع الوظائف | PieChart |
| nationality_breakdown | توزيع الجنسيات | PieChart |
| position_list | قائمة الوظائف | جدول |
| position_open_duration | مدة'ouverture الوظائف | جدول |
| relationship | علاقات التقارير | جدول |
| retirement_planning | التخطيط للتقاعد | PieChart |
| salary_list | قائمة الرواتب | جدول |
| staff_directory | دليل الموظفين | جدول |
| total | المجموع | متعدد |

### 2.4 خيارات العرض (Display Options)

| الخيار | الوصف |
|--------|-------|
| PieChart | رسم بياني دائري |
| Bar | رسم بياني شريطي |
| Scatter | رسم بياني تشتيتي |
| Column | رسم بياني أعمودي |
| Table | جدول بيانات |

### 2.5 حقول التقارير (Reporting Forms)

| النموذج | الحقول |
|---------|--------|
| person | surname, firstname, othername, nationality, country, district, county, gender, marital_status, birth_date |
| position | code, title, description, proposed_salary, source, supervisor, facility, department, pos_type, status |
| facility | name, facility_type, district, county, country, region |
| job | title, code, description, salary_grade, cadre, classification |
| salary | person, start_date, end_date, salary, notes |
| training_course | name, topic, notes, training_institution, training_funder, training_course_status, training_course_category |
| scheduled_training_course | training_course, site, num_students, start_date, end_date, country, district, county |
| person_position | person, position, start_date, end_date, reason |
| contact | person, contact_type, address, telephone, email, notes |
| demographic | person, birth_date, gender, marital_status, dependents |

---

## 3. جداول التقارير الإحصائية (Zebra Tables)

### 3.1 جدول `zebra_facility_list` — قائمة المنشآت

يحتوي هذا الجدول على بيانات مجمعة عن المنشآت الصحية للعرض السريع في التقارير.

### 3.2 جدول `zebra_position_list` — قائمة الوظائف

يحتوي هذا الجدول على بيانات مجمعة عن الوظائف الشاغرة للعرض السريع في التقارير.

### 3.3 جدول `zebra_staff_chart` — الهيكل التنظيمي للموظفين

يحتوي هذا الجدول على بيانات مجمعة عن الهيكل التنظيمي للموظفين للعرض السريع في التقارير.

### 3.4 جدول `zebra_staff_list` — قائمة الموظفين

يحتوي هذا الجدول على بيانات مجمعة عن الموظفين للعرض السريع في التقارير.

**ملاحظة:** بنية هذه الجداول غير مكتملة في الجزء المقروء من ملف SQL، ولكن وجودها يشير إلى أن النظام يدعم تقارير إحصائية مسبقة الحساب لأداء أفضل.

---

## 4. أنواع المستندات المرفقة (Attachments)

| النوع | الجدول المرتبط | الوصف |
|-------|-------------|-------|
| بلوب (blob_value) | entry | يمكن تخزين ملفات مرفقة في حقول الـ blob في جدول entry |
| صورة (blob_value) | entry | يمكن تخزين صور في حقول الـ blob في جدول entry |
| مستند (text_value) | entry | يمكن تخزين مستندات نصية في حقول text_value في جدول entry |

**ملاحظة:** لا يوجد جدول منفصل للمرفقات، بل يتم تخزينها كجزء من نموذج EAV في جداول `entry` و `last_entry`.

---

## 5. قوالب التقارير (Templates)

لا يوجد جدول منفصل لقوالب التقارير. بدلاً من ذلك، يتم تعريف قوالب التقارير في إعدادات النظام في جدول `config` تحت مسارات:
- `config:modules/CustomReports/displays/*` — أنواع العرض (PDF, PieChart, Bar, إلخ)
- `config:modules/CustomReports/reportViews/*/display_options/*` — خيارات العرض لكل تقرير

---

## 6. قواعد العمل الخاصة بالتقارير

| القاعدة | معرف | الوصف | مصدر الدليل |
|--------|-------|-------|-------------|
| BR-RP-001 | REPORT_REQUIRES_NAME | يجب أن يكون لكل تقرير اسم فريد | تحليل جدول config (مسارات CustomReports/reports/*) |
| BR-RP-002 | REPORT_REQUIRES_TYPE | يجب أن يكون لكل تقرير نوع | تحليل جدول config (مسارات CustomReports/reports/*) |
| BR-RP-003 | REPORT_VIEW_REQUIRES_REPORT | يجب أن يرتبط كل عرض تقرير بتقرير | تحليل جدول config (مسارات CustomReports/reportViews/*) |
| BR-RP-004 | REPORT_CAN_HAVE_MULTIPLE_VIEWS | يمكن أن يكون للتقرير عدة عروض | تحليل جدول config (مسارات CustomReports/reportViews/*) |
| BR-RP-005 | REPORT_CAN_BE_CACHED | يمكن تخزين التقرير مؤقتاً لأداء أفضل | وجود حقل cached في جدول report (في النظام الحديث) |
| BR-RP-006 | REPORT_CAN_BE_ENABLED_DISABLED | يمكن تمكين أو تعطيل التقرير | وجود حقل status في جدول report (في النظام الحديث) |

---

## 7. مقارنة بين التقارير المخصصة والجداول الإحصائية

| الميزة | التقارير المخصصة (Custom Reports) | الجداول الإحصائية (Zebra Tables) |
|--------|----------------------------------|----------------------------------|
| المرونة | عالية (يمكن تخصيص الحقول والعلاقات) | منخفضة (بيانات مجمعة مسبقاً) |
| الأداء | متوسط (يتطلب استعلامات مباشرة) | عالي (بيانات مجمعة مسبقاً) |
| التخصيص | عالي (يمكن تغيير خيارات العرض) | منخفض (بيانات ثابتة) |
| التحديث | فوري (يعتمد على البيانات المباشرة) | متأخر (يتطلب إعادة حساب) |
| 복잡ة | عالية (requires تكوين) | منخفضة (جاهز للاستخدام) |

---

## 8. مصفوفة الأدلة

| العنصر | المصدر | مستوى الثقة |
|--------|---------|-------------|
| إعدادات التقارير المخصصة | جدول config (مسارات CustomReports/*) | مؤكدة |
| أنواع العروض | جدول config (مسارات CustomReports/displays/*) | مؤكدة |
| حقول التقارير | جدول config (مسارات CustomReports/reporting_forms/*) | مرجحة |
| جداول Zebra | جدول zebra_* في قاعدة البيانات | مؤكدة |
| بنية جداول Zebra | غير مكتملة في ملف SQL | غير مؤكدة |
| قوالب التقارير | غير موجودة كجداول منفصلة | مؤكدة (عدم الوجود) |

---

## 9. الفجوات والثغرات في نظام التقارير

| الفجوة | معرف | الخطورة | الوصف | تأثير |
|--------|-------|---------|-------|-------|
| عدم وجود جدول تقارير منفصل | GAP-RP-001 | Medium | التقارير معرفة في إعدادات config وليس كجداول منفصلة، مما يجعل إدارة التقارير صعبة | صعوبة إدارة وتتبع التقارير |
| عدم وجود جدول لقوالب التقارير | GAP-RP-002 | Low | لا يوجد جدول منفصل لقوالب التقارير، مما يجعل إعادة استخدام القوالب صعبة | صعوبة إعادة استخدام قوالب التقارير |
| عدم وجود تتبع لاستخدام التقارير | GAP-RP-003 | Low | لا يوجد جدول لتتبع من استخدم أي تقرير ومتى | صعوبة تحليل استخدام التقارير |
| عدم وجود تصدير إلى صيغ متعددة | GAP-RP-004 | Low | لا يوجد دعم واضح للتصدير إلى PDF, Excel, CSV | صعوبة مشاركة التقارير مع الجهات الخارجية |
| عدم وجود جدولة للتقارير | GAP-RP-005 | Low | لا يوجد دعم لجدولة إرسال التقارير تلقائياً | صعوبة تلقائية إرسال التقارير |

---

## 10. المستندات وال문서를 المدعومة

| النوع | الجدول | الوصف |
|-------|--------|-------|
| تقارير مخصصة | config | تقارير يمكن تخصيصها بناءً على أي نموذج وحقل |
| تقارير إحصائية | zebra_* | تقارير مسبقة الحساب لأداء سريع |
| مرفقات | entry (blob_value) | ملفات وصور يمكن إرفاقها بالسجلات |
| مستندات نصية | entry (text_value) | مستندات نصية يمكن إرفاقها بالسجلات |

---

## 11. التوصيات لنظام التقارير في النظام الحديث

| التوصية | الوصف | الأولوية |
|----------|-------|---------|
| إنشاء جدول تقارير منفصل | إنشاء جدول reports مع حق:id, name, type, description, created_at, updated_at, created_by | عالية |
| إنشاء جدول لعروض التقارير | إنشاء جدول report_views مع حق:id, report_id, name, type, options, is_enabled | عالية |
| دعم تصدير إلى صيغ متعددة | دعم التصدير إلى PDF, Excel, CSV, JSON | متوسطة |
| دعم جدولة التقارير | دعم إرسال التقارير تلقائياً عبر البريد الإلكتروني | متوسطة |
| إنشاء جدول لقوالب التقارير | إنشاء جدول report_templates مع حق:id, name, description, template_content | منخفضة |
| إضافة تتبع لاستخدام التقارير | إضافة جدول report_usage مع حق:id, report_id, user_id, accessed_at | منخفضة |

---

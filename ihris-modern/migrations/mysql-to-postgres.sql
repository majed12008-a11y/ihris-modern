-- SQLBook: Code
-- ============================================================================
-- سكريبت ترحيل البيانات من MySQL إلى PostgreSQL
-- iHRIS Suite Migration: MySQL (i2ce) -> PostgreSQL
-- الإصدار: 1.0
-- ============================================================================
-- ملاحظة: يتم تشغيل هذا السكريبت بعد إنشاء المخطط (schema) عبر Prisma migrate
-- порядок الترحيل يحترم قيود المفاتيح الخارجية (Foreign Keys)
-- ============================================================================

-- ============================================================================
-- المرحلة 1: جداول المرجع (Reference / Lookup Tables) - لا تعتمد على جداول أخرى
-- ============================================================================

-- الدول
INSERT INTO countries (name, code)
SELECT DISTINCT name, code
FROM mysql.legacy_hippo_country
ON CONFLICT (name) DO NOTHING;

-- المناطق
INSERT INTO regions (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_region
ON CONFLICT (name) DO NOTHING;

-- المحافظات (تتبع الدولة)
INSERT INTO districts (name, country_id)
SELECT d.name, c.id
FROM mysql.legacy_hippo_district d
LEFT JOIN countries c ON d.country_name = c.name
ON CONFLICT (name) DO NOTHING;

-- المديريات (تتبع المحافظة)
INSERT INTO counties (name, district_id)
SELECT cty.name, d.id
FROM mysql.legacy_hippo_county cty
LEFT JOIN districts d ON cty.district_name = d.name
ON CONFLICT (name) DO NOTHING;

-- الأنواع الوظيفية
INSERT INTO job_types (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_position_type
ON CONFLICT (name) DO NOTHING;

-- درجات الرواتب
INSERT INTO salary_grades (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_salary_grade
ON CONFLICT (name) DO NOTHING;

-- الفئات الوظيفية
INSERT INTO cadres (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_cadre
ON CONFLICT (name) DO NOTHING;

-- التصنيفات
INSERT INTO classifications (name, description, code)
SELECT name, description, code
FROM mysql.legacy_hippo_classification
ON CONFLICT (name) DO NOTHING;

-- أقسام المنشآت
INSERT INTO departments (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_department
ON CONFLICT (name) DO NOTHING;

-- أنواع المنشآت
INSERT INTO facility_types (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_facility_type
ON CONFLICT (name) DO NOTHING;

-- أنواع الهوية
INSERT INTO id_types (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_id_type
ON CONFLICT (name) DO NOTHING;

-- اللغات
INSERT INTO languages (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_language
ON CONFLICT (name) DO NOTHING;

-- أنواع الكفاءات
INSERT INTO competency_types (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_competency_type
ON CONFLICT (name) DO NOTHING;

-- الكفاءات
INSERT INTO competencies (name, competency_type_id, notes)
SELECT c.name, ct.id, c.notes
FROM mysql.legacy_hippo_competency c
LEFT JOIN competency_types ct ON c.competency_type_name = ct.name
ON CONFLICT (name) DO NOTHING;

-- حالات التدريب
INSERT INTO training_course_statuses (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_training_course_status
ON CONFLICT (name) DO NOTHING;

-- تصنيفات التدريب
INSERT INTO training_course_categories (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_training_course_category
ON CONFLICT (name) DO NOTHING;

-- مؤسسات التدريب
INSERT INTO training_institutions (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_training_institution
ON CONFLICT (name) DO NOTHING;

-- حالات المناصب
INSERT INTO position_statuses (name)
SELECT DISTINCT name
FROM mysql.legacy_hippo_pos_change_reason
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- المرحلة 2: الكيانات الأساسية (Core Entities)
-- ============================================================================

-- المنشآت (تتبعregion, district, county, country, facility_type)
INSERT INTO facilities (name, facility_type_id, district_id, county_id, country_id, region_id)
SELECT f.name, ft.id, d.id, cty.id, co.id, r.id
FROM mysql.legacy_hippo_facility f
LEFT JOIN facility_types ft ON f.facility_type_name = ft.name
LEFT JOIN districts d ON f.district_name = d.name
LEFT JOIN counties cty ON f.county_name = cty.name
LEFT JOIN countries co ON f.country_name = co.name
LEFT JOIN regions r ON f.region_name = r.name
ON CONFLICT (name) DO NOTHING;

-- الوظائف (تتبع job, cadre, classification, salary_grade)
INSERT INTO jobs (title, code, description, salary_grade_id, cadre_id, classification_id)
SELECT j.title, j.code, j.description, sg.id, c.id, cl.id
FROM mysql.legacy_hippo_job j
LEFT JOIN salary_grades sg ON j.salary_grade_name = sg.name
LEFT JOIN cadres c ON j.cadre_name = c.name
LEFT JOIN classifications cl ON j.classification_name = cl.name
ON CONFLICT (title) DO NOTHING;

-- الأشخاص (الجدول الأساسي - 5,408 سجل في النظام الأصلي)
INSERT INTO people (
  surname, firstname, othername, nationality_id, country_id,
  district_id, county_id, residence_country_id, residence_district_id,
  residence_county_id, password
)
SELECT
  p.surname, p.firstname, p.othername, p.nationality, p.country,
  p.district, p.county, p.residence_country, p.residence_district,
  p.residence_county, p.password
FROM mysql.legacy_hippo_person p
ON CONFLICT DO NOTHING;

-- المناصب (تتبع job, facility, department, position_type, position_status, supervisor)
INSERT INTO positions (
  code, job_id, title, description, proposed_salary, source,
  supervisor_id, facility_id, department_id, pos_type_id,
  proposed_end_date, proposed_hiring_date, status_id, posted_date,
  comments, interview_comments
)
SELECT
  pos.code, pos.job, pos.title, pos.description, pos.proposed_salary, pos.source,
  pos.supervisor, pos.facility, pos.department, pos.pos_type,
  pos.proposed_end_date, pos.proposed_hiring_date, pos.status, pos.posted_date,
  pos.comments, pos.interview_comments
FROM mysql.legacy_hippo_position pos
ON CONFLICT DO NOTHING;

-- الرواتب (تتبع person)
INSERT INTO salaries (person_id, start_date, end_date, salary, notes)
SELECT s.person, s.start_date, s.end_date, s.salary, s.notes
FROM mysql.legacy_hippo_salary s
ON CONFLICT DO NOTHING;

-- ============================================================================
-- المرحلة 3: جداول العلاقات (Relation / Child Tables)
-- ============================================================================

-- ارتباط pessoa بالمنصب (تتبع person, position)
INSERT INTO person_positions (person_id, position_id, start_date, end_date, reason_id)
SELECT pp.person, pp.position, pp.start_date, pp.end_date, pp.reason
FROM mysql.legacy_hippo_person_position pp
ON CONFLICT DO NOTHING;

-- جهات الاتصال (تتبع person)
INSERT INTO contacts (
  person_id, contact_type, address, telephone, alt_telephone,
  fax, email, notes, birth_date, gender_id, marital_status_id, dependents
)
SELECT
  c.person, c.contact_type, c.address, c.telephone, c.alt_telephone,
  c.fax, c.email, c.notes, c.birth_date, c.gender, c.marital_status, c.dependents
FROM mysql.legacy_hippo_contact c
ON CONFLICT DO NOTHING;

-- البيانات الديموغرافية (تتبع person)
INSERT INTO demographics (
  person_id, birth_date, gender_id, marital_status_id, dependents
)
SELECT d.person, d.birth_date, d.gender, d.marital_status, d.dependents
FROM mysql.legacy_hippo_demographic d
ON CONFLICT DO NOTHING;

-- بطاقات الهوية (تتبع person, id_type)
INSERT INTO person_ids (person_id, id_type_id, id_num)
SELECT pid.person, pid.id_type, pid.id_num
FROM mysql.legacy_hippo_person_id pid
ON CONFLICT DO NOTHING;

-- اللغات التي يتقنها الشخص (تتبع person, language)
INSERT INTO person_languages (person_id, language_id, speaking, reading, writing)
SELECT pl.person, pl.language, pl.speaking, pl.reading, pl.writing
FROM mysql.legacy_hippo_person_language pl
ON CONFLICT DO NOTHING;

-- كفاءات الشخص (تتبع person, competency_type, competency)
INSERT INTO person_competencies (person_id, competency_type_id, competency_id)
SELECT pc.person, pc.competency_type, pc.competency
FROM mysql.legacy_hippo_person_competency pc
ON CONFLICT DO NOTHING;

-- قرارات المناصب (تتبع position)
INSERT INTO position_decisions (position_id, decision_date, offer, comments)
SELECT d.position, d.date, d.offer, d.comments
FROM mysql.legacy_hippo_position_decision d
ON CONFLICT DO NOTHING;

-- مقابلات المناصب (تتبع position)
INSERT INTO position_interviews (position_id, interview_date, person, comments)
SELECT i.position, i.date, i.person, i.comments
FROM mysql.legacy_hippo_position_interview i
ON CONFLICT DO NOTHING;

-- الملاحظات (تتبع person)
INSERT INTO notes (person_id, note, date_added)
SELECT n.person, n.note, n.date_added
FROM mysql.legacy_hippo_notes n
ON CONFLICT DO NOTHING;

-- التوظيف السابق (تتبع person)
INSERT INTO employments (
  person_id, company_name, company_address, company_phone,
  start_date, start_wage, start_position, end_date, end_wage,
  end_position, supervisor, contact_ok, responsibilities, reason_for_leaving
)
SELECT
  e.person, e.company_name, e.company_address, e.company_phone,
  e.start_date, e.start_wage, e.start_position, e.end_date, e.end_wage,
  e.end_position, e.supervisor, e.contact_ok, e.responsibilities, e.reason_for_leaving
FROM mysql.legacy_hippo_employment e
ON CONFLICT DO NOTHING;

-- التعليم (تتبع person)
INSERT INTO educations (
  person_id, edu_type_id, degree_id, institution, location, year, major, completed
)
SELECT
  ed.person, ed.edu_type, ed.degree, ed.institution, ed.location,
  ed.year, ed.major, ed.completed
FROM mysql.legacy_hippo_education ed
ON CONFLICT DO NOTHING;

-- المزايا (تتبع person)
INSERT INTO benefits (
  person_id, type_id, amount, source_id, start_date, end_date, recurrence
)
SELECT
  b.person, b.type, b.amount, b.source, b.start_date, b.end_date, b.recurrence
FROM mysql.legacy_hippo_benefit b
ON CONFLICT DO NOTHING;

-- طلبات التوظيف (تتبع person)
INSERT INTO applications (
  person_id, position_id, felony, felony_circumstance, other_info,
  hear, start_date, desired_wage, full_time, hours
)
SELECT
  a.person, a.position, a.felony, a.felony_circumstance, a.other_info,
  a.hear, a.start_date, a.desired_wage, a.full_time, a.hours
FROM mysql.legacy_hippo_application a
ON CONFLICT DO NOTHING;

-- الدورات التدريبية (تتبع institution, status, category)
INSERT INTO training_courses (
  name, topic, notes, training_institution_id, training_funder,
  continuing_education_course, training_course_status_id,
  training_course_category_id, competency
)
SELECT
  tc.name, tc.topic, tc.notes, ti.id, tc.training_funder,
  tc.continuing_education_course, tcs.id, tcc.id, tc.competency
FROM mysql.legacy_hippo_training_course tc
LEFT JOIN training_institutions ti ON tc.training_institution_name = ti.name
LEFT JOIN training_course_statuses tcs ON tc.training_course_status_name = tcs.name
LEFT JOIN training_course_categories tcc ON tc.training_course_category_name = tcc.name
ON CONFLICT DO NOTHING;

-- الدورات المجدولة (تتبع training_course, country, district, county)
INSERT INTO scheduled_training_courses (
  training_course_id, site, num_students, notes, instructors,
  start_date, end_date, country_id, district_id, county_id
)
SELECT
  stc.training_course, stc.site, stc.num_students, stc.notes, stc.instructors,
  stc.start_date, stc.end_date, stc.country, stc.district, stc.county
FROM mysql.legacy_hippo_scheduled_training_course stc
LEFT JOIN training_courses tc ON stc.training_course_name = tc.name
ON CONFLICT DO NOTHING;

-- تسجيل الأشخاص في الدورات (تتبع person, scheduled_training_course)
INSERT INTO person_scheduled_training (
  person_id, scheduled_training_course_id, is_retraining, completed,
  request_date, notes
)
SELECT
  pst.person, pst.scheduled_training_course, pst.is_retraining, pst.completed,
  pst.request_date, pst.notes
FROM mysql.legacy_hippo_person_scheduled_training_course pst
LEFT JOIN persons p ON pst.person_name = p.surname
ON CONFLICT DO NOTHING;

-- ============================================================================
-- المرحلة 4: المستخدمين والصلاحيات (Users & Access)
-- ============================================================================

-- الأدوار الأساسية
INSERT INTO roles (name, display_name, description)
VALUES
  ('admin', 'مسؤول النظام', 'الوصول الكامل لجميع أجزاء النظام'),
  ('hr_manager', 'مدير الموارد البشرية', 'إدارة الموظفين والوظائف والتقارير'),
  ('hr_staff', 'موظف موارد بشرية', 'عرض وتعديل بيانات الموظفين الأساسية'),
  ('training_manager', 'مدير التدريب', 'إدارة الدورات التدريبية والمتسجلين'),
  ('exec_manager', 'مدير تنفيذي', 'عرض التقارير والمخططات')
ON CONFLICT (name) DO NOTHING;

-- المستخدمين من النظام الأصلي
INSERT INTO users (username, password, firstname, lastname, email, creator_id)
SELECT u.username, u.password, u.firstname, u.lastname, u.email, u.creator
FROM mysql.legacy_user u
ON CONFLICT (username) DO NOTHING;

-- ربط المستخدمين بالأدوار
INSERT INTO user_access (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN mysql.legacy_access a ON u.username = a.username OR u.id::text = a.user::text
JOIN roles r ON a.role = r.name
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================================================
-- المرحلة 5: الجداول الديناميكية (EAV - records, entries, fields, forms)
-- ============================================================================
-- ملاحظة: هذه الجداول تحتوي على بيانات ديناميكية كبيرة (~35,000 صف entries)
-- يُنصح بترحيلها باستخدام أداة bulk import منفصلة للأداء الأمثل

-- النماذج
INSERT INTO forms (name, type)
SELECT DISTINCT name, type
FROM mysql.legacy_form
ON CONFLICT (name) DO NOTHING;

-- الحقول
INSERT INTO fields (name, type)
SELECT DISTINCT name, type
FROM mysql.legacy_field
ON CONFLICT (name, type) DO NOTHING;

-- ربط الحقول بالنماذج
INSERT INTO form_fields (form_id, field_id)
SELECT f.id, fl.id
FROM mysql.legacy_form_field ff
JOIN forms f ON ff.form_name = f.name
JOIN fields fl ON ff.field_name = fl.name AND ff.field_type = fl.type
ON CONFLICT DO NOTHING;

-- السجلات (البيانات الوصفية فقط)
INSERT INTO records (id, last_modified, form_id, parent_id)

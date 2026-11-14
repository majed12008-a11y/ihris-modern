# GAP-FE-009 — إضافة مؤسسة تدريبية

## الحالة
يوجد `POST /training/institutions` فقط، ولا توجد شاشة.

## القرار
- صفحة `TrainingInstitutions.tsx` على `/training/institutions` بـCRUD كامل.
- حذف فيزيائي (Hard) مع عدّ الدورات المرتبطة → 422.
- الأدوار: الكتابة `admin` + `hr_manager` + `training_manager`، القراءة `hr_staff`.

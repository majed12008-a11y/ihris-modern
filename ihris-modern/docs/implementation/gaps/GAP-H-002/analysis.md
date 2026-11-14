# GAP-H-002 — عرض المتدربين في الدورات

## الوضع الحالي
`Training.tsx` يعرض عدد المتدربين فقط (`personScheduled.length`) ولا توجد شاشة تفاصيل.

## المطلوب
- `GET /api/training/scheduled/:id/enrollments` — قائمة المتدربين (شخص + حالة الإتمام + التقييم).
- `POST /api/training/scheduled/:id/enroll` — تسجيل متدرب (`personId`).
- `PATCH/PUT /api/training/enrollments/:id` — تحديث `completed`/`notes` مع حماية IDOR.
- `DELETE /api/training/enrollments/:id`.
- واجهة `EnrolledStudents.tsx` تعرض الاسم الكامل، تاريخ الطلب، الحالة، وتسمح بالتسجيل/الإتمام.

## القيود
- لا تسجيل بعد إتمام الدورة (`status = completed`) → 422.
- لا حذف دورة مجدولة بها متدربون → 422.
- `hr_staff` قراءة فقط؛ الكتابة `admin` + `hr_manager` + `training_manager`.

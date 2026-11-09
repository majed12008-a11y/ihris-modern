# GAP-M-004 — عرض تفاصيل وظيفة

| البند | القيمة |
|-------|--------|
| المجال | إدارة الوظائف |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| نقطة النهاية | `GET /api/jobs/:id` (موسّعة بـ`positions`) |
| الصفحة | `/jobs/:id` → `JobDetail.tsx` |

## ما أُنجز
1. `JobService.getById` يستخدم `DETAIL_INCLUDE` ويحمّل `positions` مع
   `posType`/`status`/`facility`/`department` (مرتبة بالمعرّف).
2. `toPublic` يعيد مصفوفة `positions` كاملة فقط عند توفرها (القائمة تبقى خفيفة).
3. صفحة `JobDetail.tsx` تعرض: المسمى، الكود، الوصف، درجة الراتب، الفئة،
   التصنيف، الإصدار، تواريخ الإنشاء/التحديث، والمناصب المرتبطة.
4. زر «عرض التفاصيل» (أيقونة عين) في `Jobs.tsx` ينقل إلى `/jobs/:id`.

## الملفات
- `backend/src/services/job.service.ts`
- `frontend/src/pages/JobDetail.tsx`
- `frontend/src/pages/Jobs.tsx` (زر العرض)
- `frontend/src/App.tsx` (`jobs/:id`)

## الاختبار
`reference.test.ts` سيناريو 21 (إنشاء job بمراجع seeded) + `reference.test.ts` كتلة القراءة.

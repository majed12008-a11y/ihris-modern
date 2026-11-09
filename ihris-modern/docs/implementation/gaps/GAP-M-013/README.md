# GAP-M-013 — إدارة التصنيفات الوظيفية (Classification CRUD)

| البند | القيمة |
|-------|--------|
| المجال | إدارة الوظائف / البيانات المرجعية |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| المسار | `/api/reference/classifications` |
| الصفحة | `/reference/classifications` → `Classifications.tsx` |

## القواعد
1. CRUD كامل بنفس نمط ADR-008 (قراءة للجميع، كتابة admin+hr_manager، حذف admin).
2. `name`/`code` فريدان تطبيقياً (case-insensitive) → 409.
3. `version` قفل تفاؤلي → 409.
4. حذف تصنيف مستخدم في `jobs.classificationId` → 422.
5. تدقيق موحّد entityType=`classification`.

## البيانات
Seed: 6 صفوف FACT من `DB export.sql`، منها 5 بأكواد ISCO أصلية
(222، 223، 322، 241، 411) و`PHA` مشتق للـPharmacist (كان `NULL`).

## الاختبار
`reference.test.ts` كتلة «تصنيف» + `reference.security.test.ts` S9 (قراءة hr_staff).

# GAP-M-014 — إدارة أنواع الوظائف (Position Type CRUD)

| البند | القيمة |
|-------|--------|
| المجال | إدارة الوظائف / البيانات المرجعية |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| المسار | `/api/reference/position-types` |
| الصفحة | `/reference/position-types` → `PositionTypes.tsx` |

## القواعد
1. الجدول موجود أصلاً باسم `JobType`/`position_types`؛ تم **توسيعه** بـ
   `code`/`description`/`version` لا إنشاؤه.
2. CRUD كامل بنفس نمط ADR-008.
3. `name`/`code` فريدان تطبيقياً → 409؛ `version` → 409.
4. حذف نوع مستخدم في `positions.posTypeId` → 422.
5. تدقيق موحّد entityType=`position_type`.

## البيانات
Seed: 4 صفوف FACT (Permanent Full-Time، Permanent Part-Time، Temporary Hourly،
Consultant) بأكواد `PT-*` مشتقة.

## الاختبار
`reference.test.ts` كتلة «نوع وظيفة» + `reference.extra.test.ts` S9 (مرتبط بمنصب → 422).

# GAP-M-015 — إدارة مصادر الرواتب (Salary Source CRUD)

| البند | القيمة |
|-------|--------|
| المجال | إدارة الرواتب / البيانات المرجعية |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| المسار | `/api/reference/salary-sources` |
| الصفحة | `/reference/salary-sources` → `SalarySources.tsx` |

## القواعد
1. جدول **جديد** `salary_sources` (لم يكن موجوداً في المخطط الحديث).
2. CRUD كامل بنفس نمط ADR-008.
3. `name`/`code` فريدان تطبيقياً → 409؛ `version` → 409.
4. **الحذف مسموح دائماً** — لا FK من `positions.source` (نص حر في القديم والحديث).
   هذا قرار موثّق في ADR-008 §8.5، ويُسجَّل كبند متابعة لتحويله إلى FK لاحقاً.
5. تدقيق موحّد entityType=`salary_source`.

## البيانات
Seed: 7 صفوف FACT من `DB export.sql` (NGO، Commercial، Individual Donor، FBO،
Association، Ministry of Health، Private) بأكواد `SRC-*` مشتقة.

## الاختبار
`reference.test.ts` كتلة «مصدر راتب» + `reference.extra.test.ts` (409/404).

# GAP-M-012 — إدارة الفئات الوظيفية (Cadre CRUD)

| البند | القيمة |
|-------|--------|
| المجال | إدارة الوظائف / البيانات المرجعية |
| الحالة | ✅ **مكتملة** — Sprint 5 |
| الفرع | `feature/sprint-5-reference-data` |
| ADR | ADR-008 (`04-DECISIONS.md` §8) |
| المسار | `/api/reference/cadres` |
| الصفحة | `/reference/cadres` → `Cadres.tsx` |

## القواعد
1. CRUD كامل: `GET` للجميع، `POST`/`PUT` لـ`admin`+`hr_manager`، `DELETE` لـ`admin`.
2. `name`/`code` فريدان تطبيقياً (case-insensitive) → 409.
3. `version` قفل تفاؤلي → 409 عند التعارض.
4. حذف فئة مستخدمة في `jobs.cadreId` → 422.
5. تدقيق موحّد في `reference_data_audit_log` (entityType=`cadre`).
6. بحث بالاسم/الكود + ترقيم 20.

## البيانات
Seed: 4 صفوف FACT من `DB export.sql` (Medical Doctor، Nurse، Allied Health Professional،
Pharmacist) بأكواد `CAD-*` مشتقة.

## الاختبار
`reference.test.ts` كتلة «فئة» + `reference.extra.test.ts` (409/404/403) + `reference.validation.test.ts`.

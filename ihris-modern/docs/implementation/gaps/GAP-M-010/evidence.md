# GAP-M-010 — الأدلة

| معرف | النوع | المصدر | الوصف |
|------|-------|--------|-------|
| M10-E1 | FACT | `country.test.ts` (5) | 200 + حذف فعلي + بقاء سجل التدقيق |
| M10-E2 | FACT | `country.test.ts` (6) | 422 + `details.peopleCountry>0` + بقاء الدولة |
| M10-E3 | FACT | `country.service.ts` (`referenceCounts`) | عدّ 6 مراجع، منها 3 بلا FK |
| M10-E4 | FACT | `country.security.test.ts` (S2) | بلا توكن → 401 وعدم الحذف |
| M10-E5 | FACT | `country.security.test.ts` (S1) | `hr_staff` → 403 |

## مقتطف تشغيل
```text
PASS src/__tests__/country.test.ts
  √ 5) admin يحذف دولة بلا مراجع → 200
  √ 6) admin يحذف دولة مستخدمة (شخص/منشأة) → 422
```

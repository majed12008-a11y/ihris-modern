# iHRIS Suite — النسخة الحديثة

نظام إدارة الموارد البشرية للمنشآت الصحية: سجلات الموظفين، الوظائف والمناصب،
المنشآت، الرواتب، التدريب، التقارير، وإدارة المستخدمين — بواجهة عربية كاملة
(RTL) مبنية على React و TypeScript، وواجهة برمجية على Node/Express و PostgreSQL.

التطبيق كامل داخل مجلد [`ihris-modern/`](ihris-modern) — وهو النسخة المعاد
بناؤها من نظام iHRIS القديم (PHP/MySQL). تفاصيل التشغيل الموسّعة واستكشاف
الأخطاء في [`ihris-modern/README.md`](ihris-modern/README.md).

> **الحالة:** تطوير نشط. الوحدات الأساسية تعمل وتُختبر، وبعض الشاشات الإدارية
> المتقدمة ما زالت مقتصرة على الـAPI.

---

## المحتويات

| الوحدة | الوصف |
| --- | --- |
| الموظفون | سجل الموظف، البحث والتصفية، الحذف الفردي والجماعي |
| الوظائف والمناصب | عناوين الوظائف، المناصب، الأنواع، الأكواد الوظيفية |
| المنشآت | المنشآت الصحية وتقسيماتها الجغرافية وعدد وظائفها |
| الرواتب | سجلات الرواتب، الدرجات، المصادر |
| التدريب | الدورات، المؤسسات التدريبية، الجلسات المجدولة، الطلاب المسجّلون |
| التقارير | محرّك تقارير بصلاحيات وحقول مسموحة، تصدير CSV / Excel / PDF |
| المستخدمون | الأدوار، الحالة، التعطيل والحذف المنطقي والاستعادة |
| البيانات المرجعية | الدرجات، الكوادر، التصنيفات، أنواع المناصب، مصادر الرواتب |

---

## البنية التقنية

- **الواجهة:** React 18 · TypeScript · Vite · React Router · TanStack Query ·
  Zustand · Tailwind CSS · Sonner
- **الخادم:** Node.js · Express · TypeScript · Prisma ORM · PostgreSQL
- **المصادقة:** JWT + bcrypt
- **الاختبارات:** Jest (الخادم) · Vitest + Testing Library (الواجهة)

```
ihris-modern/
├─ backend/            # Express API + Prisma schema وmigrations
├─ frontend/           # تطبيق React
│  └─ src/
│     ├─ index.css     # نظام التصميم (الرموز + مكوّنات CSS)
│     ├─ components/   # التخطيط، عناصر واجهة مشتركة، مكوّنات البيانات المرجعية
│     ├─ hooks/        # useListParams، useDebouncedValue
│     ├─ pages/        # صفحات التطبيق
│     └─ services/     # عميل الـAPI
├─ docs/               # وثائق التنفيذ والمقارنة مع النظام القديم
├─ migrations/         # سكربتات ترحيل MySQL → PostgreSQL
└─ docker-compose.yml  # postgres + backend + frontend
```

---

## التشغيل السريع (Docker)

```bash
cd ihris-modern
docker compose up --build
```

- الواجهة: <http://localhost:5173>
- الـAPI: <http://localhost:5000/api>

## التشغيل اليدوي

### 1) قاعدة البيانات

```bash
docker compose up -d postgres
# أو استخدم تثبيتاً محلياً لـ PostgreSQL 15+
```

### 2) الخادم

```bash
cd ihris-modern/backend
cp .env.example .env          # ثم اضبط DATABASE_URL و JWT_SECRET
npm install
npm run prisma:migrate        # إنشاء الجداول
npm run prisma:seed           # بيانات أولية + حساب المدير
npm run dev                   # http://localhost:5000
```

### 3) الواجهة

```bash
cd ihris-modern/frontend
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

### متغيّرات البيئة الأساسية

| المتغيّر | الوصف |
| --- | --- |
| `DATABASE_URL` | `postgresql://user:password@host:5432/db` |
| `JWT_SECRET` | مفتاح توقيع الرموز — استبدله في الإنتاج |
| `JWT_EXPIRES_IN` | مدة صلاحية الرمز (افتراضياً `7d`) |
| `CORS_ORIGIN` | أصل الواجهة المسموح (افتراضياً `http://localhost:5173`) |
| `PORT` | منفذ الـAPI (افتراضياً `5000`) |
| `VITE_API_URL` | عنوان الـAPI الذي تستدعيه الواجهة |

### بيانات الدخول الافتراضية (بيئة التطوير فقط)

| اسم المستخدم | كلمة المرور | الدور |
| --- | --- | --- |
| `admin` | `admin123` | مسؤول نظام |
| `testuser` | `testpass123` | مستخدم تجريبي |

> لا تُستخدم هذه الحسابات في الإنتاج. أنشئ حساباً جديداً وغيّر كلمات المرور.

---

## الاختبارات

```bash
cd ihris-modern
npm test                 # اختبارات الخادم (تتطلّب قاعدة بيانات اختبار)
npm run test:frontend    # Vitest للواجهة
npm run test:preflight   # التحقق من جاهزية بيئة الاختبار
```

---

## نظام التصميم

الواجهة تتبع اتجاهاً بصرياً واحداً («سجل مؤسسي»): أخضر حِبري مع لمسات نحاسية،
جداول كثيفة، وأسطح هادئة.

- **المصدر الوحيد للحقيقة:** `frontend/src/index.css` — رموز `:root`
  (ألوان، أنصاف أقطار، ظلال) ثم `@layer components` لكل المكوّنات:
  `.page-head`، `.card`، `.data-table`، `.toolbar`، `.btn`، `.field`،
  `.dialog`، `.state`، `.pill`، `.pager` …
- `frontend/tailwind.config.js` يعكس نفس الألوان، مع `primary` كاسم متوافق
  مع الصفحات القديمة.
- العناصر المشتركة القابلة لإعادة الاستخدام في `frontend/src/components/ui/`:
  `PageHeader`، `Pagination`، `SearchInput`، `ConfirmDialog`، `Pill`،
  و`StateViews` (تحميل / خطأ / فراغ / هياكل تحميل).
- حالة القوائم (بحث، صفحة، حجم الصفحة) محفوظة في عنوان URL عبر
  `useListParams`، فيعمل التحديث والمشاركة وزر الرجوع كما هو متوقّع.
- الواجهة متجاوبة حتى عرض 360px، وتحترم `prefers-reduced-motion`، وتستخدم
  خصائص CSS المنطقية لتناسب RTL.

---

## الفروع

| الفرع | الغرض |
| --- | --- |
| `main` | الحالة المستقرة الحالية |
| `feature/ui-registry-redesign` | إعادة التصميم البصري الشاملة |
| `feature/GAP-*` | إغلاق فجوات محدّدة (تقارير، مستخدمون، منشآت، بيانات مرجعية) |
| `feature/sprint-*` | أعمال السبرنتات (التدريب، البيانات المرجعية، التقوية) |

---

## ملاحظات وحدود معروفة

- التقسيمات الإدارية الدقيقة (المديريات/المحافظات) غير مُدارة من الواجهة بعد؛
  تُحفظ القيم الحالية عند التعديل.
- سجل التدقيق الكامل وإعدادات النظام ما زالت مقتصرة على الـAPI.
- التصدير إلى Excel يعتمد على قيم نصية (بلا تنسيق خلايا متقدّم).

---

## الترخيص

راجع ملف [`license.txt`](license.txt) في جذر المستودع.

---

### English summary

Modern iHRIS Suite for health-sector HR: employee registry, jobs and positions,
facilities, payroll, training, a permission-aware report engine with CSV/Excel/PDF
export, and user administration. React 18 + TypeScript + Vite on the front end;
Express + Prisma + PostgreSQL on the back end. Arabic-first RTL UI with a single
design system in `frontend/src/index.css`. Everything lives in `ihris-modern/`.
Run with `docker compose up --build` there, or start `backend` and `frontend`
separately (see above). Tests: `npm test` (server) and `npm run test:frontend`.

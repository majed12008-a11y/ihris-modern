# iHRIS Suite - Modernized

نظام iHRIS Suite المحدث - chuyển من PHP/MySQL إلى stack moderna:
- **PostgreSQL** (قاعدة البيانات)
- **Node.js + TypeScript + Express** (الخلفي)
- **React + TypeScript + Vite** (الواجهة الأمامية)

## ما تم إنجازه ✅

| المكون | الحالة |
|--------|--------|
| تحليل النظام الأصلي (PHP/MySQL/i2ce) | ✅ مكتمل |
| مخطط PostgreSQL (Prisma schema) | ✅ 25+ نموذج |
| API الخلفي (Node.js + Express + TypeScript) | ✅ 7 مسارات، 7 خدمات |
| واجهة أمامية (React + TypeScript + Vite) | ✅ 8 صفحات، تخطيط توجيهي |
| سكريبت ترحيل MySQL → PostgreSQL | ✅ 5 مراحل |
| seed مع بيانات تجريبية عربية | ✅ مكتمل |
| اختبارات API (Jest + Supertest) | ✅ 3 ملفات |
| اختبار واجهة أمامية (Vitest) | ✅ ملف اختبار |
| Docker Compose للنشر | ✅ مكتمل |
| توثيق وخطة تنفيذ | ✅ PLAN_AR.md |

## هيكل المشروع

```
ihris-modern/
├── backend/                 # Node.js + TypeScript API
│   ├── prisma/schema.prisma # مخطط قاعدة البيانات PostgreSQL
│   ├── src/
│   │   ├── config/          # إعدادات الاتصال والبيئة
│   │   ├── controllers/     # auth, person, position, facility, salary, training, user
│   │   ├── middleware/      # auth (JWT), rbac (الأدوار), error handling
│   │   ├── routes/          # /api/auth, /api/persons, /api/positions, /api/facilities, /api/salaries, /api/training, /api/users
│   │   ├── services/        # منطق العمل لكل كيان
│   │   ├── lib/             # prisma, password (bcrypt), jwt
│   │   ├── scripts/         # seed (بيانات تجريبية), mysql-to-postgres (ترحيل)
│   │   └── __tests__/       # اختبارات API
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/layout/MainLayout.tsx
│   │   ├── pages/Login, Dashboard, Persons, PersonDetail, Positions, Salaries, Training, Users
│   │   ├── services/api.ts  # axios مع interceptors للمصادقة
│   │   ├── store/authStore.ts # Zustand مع persist
│   │   ├── types/index.ts
│   │   └── __tests__/
│   ├── Dockerfile, nginx.conf
│   └── package.json
├── migrations/mysql-to-postgres.sql  # سكريبت ترحيل البيانات (5 مراحل)
├── docker-compose.yml               # نشر سريع عبر Docker
├── docs/PLAN_AR.md                  # الخطة التفصيلية والتقدم
└── README.md
```

## بداية سريعة (Quick Start)

### المتطلبات
- Node.js 20+
- PostgreSQL 15+
- npm أو yarn

### 1. التثبيت والإعداد

```bash
cd ihris-modern

# الخلفي
cd backend
cp .env.example .env
# عدل DATABASE_URL و MySQL credentials في .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

# الواجهة الأمامية
cd ../frontend
cp .env.example .env
npm install
```

### 2. تشغيل بيئة التطوير

```bash
# المحطة الأولى - الخلفي
cd backend
npm run dev

# المحطة الثانية - الواجهة الأمامية
cd frontend
npm run dev
```

النظام سيكون متاحاً على:
- الواجهة: `http://localhost:5173`
- API: `http://localhost:5000`
- قاعدة البيانات: `localhost:5432`

### 3. التشغيل عبر Docker

```bash
docker-compose up -d
```

### 4. تشغيل الاختبارات

```bash
# اختبارات الخلفي
cd backend
npm test

# اختبارات الواجهة الأمامية
cd frontend
npm test
```

## بيانات الدخول الافتراضية

| اسم المستخدم | كلمة المرور | الدور |
|-------------|------------|-------|
| admin | admin123 | مسؤول نظام |
| testuser | testpass123 | مستخدم تجريبي |

## صفحات النظام

1. **لوحة التحكم** - نظرة عامة مع بطاقات إحصائية
2. **الموظفون** - قائمة، بحث، إضافة، تفاصيل موظف
3. **الوظائف** - إدارة الشواغر والهيكل الوظيفي
4. **الرواتب** - تسجيل ومتابعة الرواتب
5. **التدريب** - الدورات التدريبية والمؤسسات والمتسجلين
6. **المستخدمون** - إدارة الحسابات والصلاحيات
7. **تسجيل الدخول** - مصادقة JWT

## تصحيح الأخطاء (Troubleshooting)

### شاشة فارغة بعد تسجيل الدخول

إذا ظهرت شاشة فارغة أو بيضاء بعد تسجيل الدخول، اتبع هذه الخطوات:

1. **افتح أدوات المطورين (Developer Tools)** في المتصفح:
   - اضغط `F12` أو `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - اذهب إلى علامة التبويب **Console** لرؤية أخطاء جافاسكريبت
   - اذهب إلى علامة التبويب **Network** لرؤية فشل استدعاءات API

2. **تأكد من أن الخادم الخلفي يعمل**:
   ```bash
   curl http://localhost:5000/health
   # يجب أن يعيد: {"status":"ok","service":"ihris-backend",...}
   ```

3. **تأكد من أن رمز المصادقة مخزن**:
   - في أدوات المطورين، اذهب إلى **Application** > **Local Storage**
   - تأكد من وجود مفتاح `ihris-auth-storage` يحتوي على رمز المصادقة

4. **حدث الصفحة**:
   - أحيانًا يحتاج المتصفح إلى تحديث الصفحة بعد تسجيل الدخول لاستعادة حالة المصادقة من localStorage

### أخطاء شائعة

| الخطأ | السبب | الحل |
|-------|--------|------|
| `No QueryClient set` | React Query غير مغلف بـ Provider | تأكد من أن main.tsx يحتوي على QueryClientProvider |
| `401 Unauthorized` | رمز المصادقة منتهي أو مفقود | سجل الدخول مرة أخرى |
| `Cannot connect to API` | الخادم الخلفي غير يعمل | شغّل `npm run dev` في مجلد backend |
| `CORS error` | واجهة أمامية لا يمكنها الوصول للخادم | تأكد من أن CORS_ORIGIN مضبوط بشكل صحيح في .env |

### بيانات الدخول التجريبية

| اسم المستخدم | كلمة المرور | الدور |
|-------------|------------|-------|
| admin | admin123 | مسؤول نظام |

## الترخيص

تم التحويل من iHRIS Suite الأصلي المرخص تحت GPL v3 بواسطة IntraHealth International.

## الخطة التفصيلية

راجع `docs/PLAN_AR.md` للخطة التنفيذية الكاملة مع الجدول الزمني ومراحل التقدم.

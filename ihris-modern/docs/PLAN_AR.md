# خطة تنفيذ تحويل iHRIS Suite إلى stack حديثة

## نظرة عامة
تحويل نظام iHRIS Suite (PHP 5.2 + MySQL 5.0 + Apache + i2ce framework) إلى:
- **قاعدة البيانات:** PostgreSQL 15+
- **الخلفي:** Node.js + TypeScript + Express + Prisma ORM
- **الواجهة الأمامية:** React 18 + TypeScript + Vite + Tailwind CSS

## هيكل المشروع (منفذ)
```
ihris-modern/
├── backend/                 # Node.js API ✅ مكتمل
│   ├── prisma/schema.prisma # مخطط PostgreSQL (25+ نموذج) ✅
│   ├── src/
│   │   ├── config/          # إعدادات البيئة ✅
│   │   ├── controllers/     # auth, person, position, facility, salary, training, user ✅
│   │   ├── middleware/      # auth, rbac, error handling ✅
│   │   ├── routes/          # 7 مسارات API ✅
│   │   ├── services/        # 7 خدمات عمل ✅
│   │   ├── lib/             # prisma, password (bcrypt), jwt ✅
│   │   ├── scripts/         # seed, mysql-to-postgres migration ✅
│   │   └── __tests__/       # اختبارات API (auth, person, position) ✅
│   ├── Dockerfile ✅
│   └── package.json ✅
├── frontend/                # React واجهة أمامية ✅ مكتمل
│   ├── src/
│   │   ├── components/layout/MainLayout.tsx ✅
│   │   ├── pages/Login, Dashboard, Persons, PersonDetail, Positions, Salaries, Training, Users ✅
│   │   ├── services/api.ts  # axios مع interceptors ✅
│   │   ├── store/authStore.ts # Zustand مع persist ✅
│   │   ├── types/index.ts   # تعريفات TypeScript ✅
│   │   └── __tests__/       # اختبار صفحة تسجيل الدخول ✅
│   ├── Dockerfile, nginx.conf ✅
│   └── package.json ✅
├── migrations/
│   └── mysql-to-postgres.sql ✅ (سكريبت ترحيل كامل 5 مراحل)
├── docker-compose.yml ✅
├── docs/PLAN_AR.md ✅
└── README.md ✅
```

## مراحل التنفيذ والتقدم

### المرحلة 1: التصميم والمخطط الأساسي ✅ مكتملة (100%)
| المهمة | الحالة |
|-------|--------|
| تحليل نموذج البيانات الحالي | ✅ مكتمل - 52 نموذج، 128 حقل، 5,408 سجل، 35,212 إدخال |
| تصميم مخطط PostgreSQL | ✅ مكتمل - Prisma schema مع 25+ نموذج |
| إعداد بيئة التطوير | ✅ مكتمل - Node.js, TypeScript, Prisma, React, Vite |
| تجميع TypeScript | ✅ backend و frontend بدون أخطاء |

### المرحلة 2: ترحيل البيانات 🔄 قيد التنفيذ (70%)
| المهمة | الحالة |
|-------|--------|
| كتابة سكريبت الترحيل | ✅ مكتمل - 5 مراحل مع ON CONFLICT |
| ترحيل بيانات المرجعية | ✅ مكتمل في السكريبت |
| ترحيل بيانات الأشخاص والوظائف | ✅ مكتمل في السكريبت |
| التحقق من سلامة البيانات | ⏳ pending - بعد تشغيل PostgreSQL |

### المرحلة 3: تطوير الـ API الخلفي ✅ مكتملة (100%)
| المهمة | الحالة |
|-------|--------|
| نظام المصادقة (JWT + bcrypt) | ✅ مكتمل |
| نظام الصلاحيات (RBAC) | ✅ مكتمل - 5 أدوار |
| API الأشخاص | ✅ مكتمل (CRUD + بحث + ترحيل) |
| API الوظائف | ✅ مكتمل (CRUD + بحث + ترحيل) |
| API المنشآت | ✅ مكتمل (CRUD + ترحيل) |
| API الرواتب | ✅ مكتمل (CRUD + ترحيل) |
| API التدريب | ✅ مكتمل (الدورات، المؤسسات، الحالات، التصنيفات) |
| API المستخدمين | ✅ مكتمل (CRUD + تغيير الدور) |
| اختبارات API (Jest + Supertest) | ✅ مكتمل - 3 ملفات اختبار |

### المرحلة 4: واجهة المستخدم React ✅ مكتملة (85%)
| المهمة | الحالة |
|-------|--------|
| إعداد المشروع (Vite + React + TypeScript + Tailwind) | ✅ مكتمل |
| صفحة تسجيل الدخول | ✅ مكتملة مع التحقق |
| لوحة التحكم | ✅ مكتملة مع بطاقات إحصائية |
| إدارة الأشخاص (قائمة، بحث، حذف) | ✅ مكتملة |
| تفاصيل الشخص | ✅ مكتملة (المعلومات الأساسية، الاتصالات، الرواتب، المناصب) |
| إدارة الوظائف | ✅ مكتملة |
| إدارة الرواتب | ✅ مكتملة |
| إدارة التدريب | ✅ مكتملة مع بطاقات ملخصة |
| إدارة المستخدمين | ✅ مكتملة |
| التخطيط التوجيهي (MainLayout) | ✅ مكتمل معsidebar |
| اختبار واجهة أمامية (Vitest + Testing Library) | ✅ مكتمل - اختبار تسجيل الدخول |

### المرحلة 5: الاختبار والنشر ⏳ pending (15%)
| المهمة | الحالة |
|-------|--------|
| اختبار الوحدات (Jest backend) | ✅ ملفات جاهزة، يحتاج تشغيل ضد قاعدة بيانات تجريبية |
| اختبار التكامل (مقارنة MySQL ↔ PostgreSQL) | ⏳ pending |
| اختبار القبول (تجربة المستخدم) | ⏳ pending |
| النشر الإنتاجي (Docker Compose) | ✅ ملفات جاهزة |

## قرارات التصميم الرئيسية

1. **قاعدة البيانات:** جداول علاقاتية ثابتة في PostgreSQL لكل كيان رئيسي مع جداول EAV للتوافق العكسي.
2. **ORM:** Prisma لسهولة التعريف والنقل بين قواعد البيانات.
3. **المصادقة:** JWT مع refresh tokens، bcrypt لكلمات المرور.
4. **إدارة الحالة:** Zustand للحالة المحلية، TanStack Query لبيانات الخادم.
5. **نشر:** Docker Compose للبيئة التطويرية والإنتاجية.

## التقدير الزمني المتبقي
- إكمال الترحيل والتحقق: أسبوعان
- اختبار ومقارنة البيانات: أسبوعان
- النشر الإنتاجي: أسبوع
- **المتبقي:** حوالي 5 أسابيع

## بيانات الدخول الافتراضية

| اسم المستخدم | كلمة المرور | الدور |
|-------------|------------|-------|
| admin | admin123 | مسؤول نظام |
| testuser | testpass123 | مستخدم تجريبي |

## أوامر التشغيل السريعة

```bash
# الخلفي
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

# الواجهة الأمامية (في محطة ثانية)
cd frontend
cp .env.example .env
npm install
npm run dev

# الاختبارات
cd backend
npm test

# النشر عبر Docker
docker-compose up -d
```

## الروابط بعد التشغيل
- الواجهة: `http://localhost:5173`
- API: `http://localhost:5000`
- قاعدة البيانات: `localhost:5432`
- تسجيل الدخول: `http://localhost:5173/login`

---
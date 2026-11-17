import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  BookOpen,
  Shield,
  Settings,
  UserX,
  Building2,
  Globe2,
  Layers,
  Wallet,
  UserCog,
  Tags,
  Landmark,
  Database,
  ChevronDown,
  ChevronUp,
  Menu,
  Search,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

/**
 * هيكل التطبيق: شريط جانبي داكن مجمّع + شريط علوي فيه مسار التنقل وبحث.
 * تجميع البيانات المرجعية الخمسة تحت قائمة قابلة للطي (ADR-009 §9.2 القرار 10).
 */

type NavItem = { name: string; path: string; icon: typeof Settings };

const primaryNavigation: NavItem[] = [
  { name: "لوحة التحكم", path: "/dashboard", icon: LayoutDashboard },
  { name: "الموظفون", path: "/persons", icon: Users },
  { name: "المنشآت", path: "/facilities", icon: Building2 },
  { name: "الوظائف", path: "/positions", icon: Briefcase },
  { name: "المسميات الوظيفية", path: "/jobs", icon: Layers },
];

const referenceNavigation: NavItem[] = [
  { name: "درجات الرواتب", path: "/reference/salary-grades", icon: Wallet },
  { name: "الفئات الوظيفية", path: "/reference/cadres", icon: UserCog },
  { name: "التصنيفات الوظيفية", path: "/reference/classifications", icon: Tags },
  { name: "أنواع الوظائف", path: "/reference/position-types", icon: Briefcase },
  { name: "مصادر الرواتب", path: "/reference/salary-sources", icon: Landmark },
];

const operationsNavigation: NavItem[] = [
  { name: "الدول", path: "/countries", icon: Globe2 },
  { name: "الرواتب", path: "/salaries", icon: CreditCard },
  { name: "التدريب", path: "/training", icon: BookOpen },
];

const settingsItem: NavItem = { name: "الإعدادات", path: "/settings", icon: Settings };

const REFERENCE_PREFIX = "/reference/";

/** عناوين الصفحات لمسار التنقل العلوي. */
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/persons": "الموظفون",
  "/facilities": "المنشآت",
  "/positions": "الوظائف",
  "/jobs": "المسميات الوظيفية",
  "/salaries": "الرواتب",
  "/training": "التدريب",
  "/training/institutions": "مؤسسات التدريب",
  "/users": "المستخدمون",
  "/users/deleted": "المستخدمون المحذوفون",
  "/countries": "الدول",
  "/reports": "التقارير",
  "/settings": "الإعدادات",
  "/reference/salary-grades": "درجات الرواتب",
  "/reference/cadres": "الفئات الوظيفية",
  "/reference/classifications": "التصنيفات الوظيفية",
  "/reference/position-types": "أنواع الوظائف",
  "/reference/salary-sources": "مصادر الرواتب",
};

const SUFFIX_LABELS: Record<string, string> = {
  new: "إضافة",
  edit: "تعديل",
};

function crumbsFor(pathname: string): { parent?: string; leaf: string } {
  const exact = ROUTE_TITLES[pathname];
  if (exact) return { leaf: exact };

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";

  // ابحث عن أطول بادئة معروفة لنعرضها كأب
  for (let take = segments.length - 1; take > 0; take -= 1) {
    const prefix = "/" + segments.slice(0, take).join("/");
    if (ROUTE_TITLES[prefix]) {
      return {
        parent: ROUTE_TITLES[prefix],
        leaf: SUFFIX_LABELS[last] ?? "التفاصيل",
      };
    }
  }

  return { leaf: "لوحة التحكم" };
}

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  hr_manager: "مدير الموارد البشرية",
  hr_staff: "موظف موارد بشرية",
};

function initials(first?: string, last?: string) {
  const a = (first ?? "").trim().charAt(0);
  const b = (last ?? "").trim().charAt(0);
  return (a + b) || "؟";
}

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "admin";
  const canListUsers = isAdmin || user?.role === "hr_manager";

  const currentPath = location.pathname;
  const isReferenceActive = currentPath.startsWith(REFERENCE_PREFIX);

  const [referenceOpen, setReferenceOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [term, setTerm] = useState("");

  // افتح المجموعة تلقائياً عند الوصول إلى صفحة مرجعية عبر رابط مباشر.
  useEffect(() => {
    if (isReferenceActive) setReferenceOpen(true);
  }, [isReferenceActive]);

  // أغلق الدرج عند تغيير الصفحة.
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentPath]);

  // Ctrl/⌘ + K يركّز البحث.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("ihris_token");
    localStorage.removeItem("ihris_user");
    navigate("/login");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/persons?q=${encodeURIComponent(q)}` : "/persons");
  };

  const renderLink = (item: NavItem, sub = false) => {
    const Icon = item.icon;
    const isActive = currentPath === item.path;
    return (
      <li key={item.name}>
        <a
          href={item.path}
          onClick={(e) => {
            e.preventDefault();
            navigate(item.path);
          }}
          aria-current={isActive ? "page" : undefined}
          className={`nav-item${isActive ? " is-active" : ""}${
            sub ? " nav-item--sub" : ""
          }`}
        >
          <Icon aria-hidden="true" />
          <span>{item.name}</span>
        </a>
      </li>
    );
  };

  const crumbs = crumbsFor(currentPath);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        تخطَّ إلى المحتوى
      </a>

      <div
        className={`sidebar-scrim${drawerOpen ? " is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar${drawerOpen ? " is-open" : ""}`} aria-label="القائمة الجانبية">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EAF3EF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20V9l8-5 8 5v11" />
              <path d="M9 20v-5h6v5" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name" translate="no">
              iHRIS Suite
            </span>
            <span className="brand-sub">نظام معلومات الموارد البشرية</span>
          </div>
          <button
            type="button"
            className="icon-btn menu-btn sidebar-logout"
            aria-label="إغلاق القائمة"
            onClick={() => setDrawerOpen(false)}
            style={{ marginInlineStart: "auto" }}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="nav" aria-label="التنقل الرئيسي">
          <ul className="flex flex-col gap-[2px] list-none p-0 m-0">
            {primaryNavigation.map((item) => renderLink(item))}
          </ul>

          <button
            type="button"
            onClick={() => setReferenceOpen((open) => !open)}
            aria-expanded={referenceOpen}
            aria-controls="reference-navigation"
            className="nav-group-toggle"
          >
            <Database size={12} aria-hidden="true" />
            <span>البيانات المرجعية</span>
            {referenceOpen ? (
              <ChevronUp aria-hidden="true" />
            ) : (
              <ChevronDown aria-hidden="true" />
            )}
          </button>
          {referenceOpen && (
            <ul
              id="reference-navigation"
              className="flex flex-col gap-[2px] list-none p-0 m-0"
            >
              {referenceNavigation.map((item) => renderLink(item, true))}
            </ul>
          )}

          <div className="nav-label">العمليات</div>
          <ul className="flex flex-col gap-[2px] list-none p-0 m-0">
            {operationsNavigation.map((item) => renderLink(item))}
            {canListUsers && (
              <li>
                <a
                  href="/users"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/users");
                  }}
                  aria-current={currentPath === "/users" ? "page" : undefined}
                  className={`nav-item${currentPath === "/users" ? " is-active" : ""}`}
                >
                  <Shield aria-hidden="true" />
                  <span>المستخدمون</span>
                </a>
              </li>
            )}
            {!canListUsers &&
              user &&
              renderLink({
                name: "ملفي الشخصي",
                path: `/users/${user.id}/edit`,
                icon: Shield,
              })}
            {isAdmin && (
              <li>
                <a
                  href="/users/deleted"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/users/deleted");
                  }}
                  aria-current={
                    currentPath === "/users/deleted" ? "page" : undefined
                  }
                  className={`nav-item${
                    currentPath === "/users/deleted" ? " is-active" : ""
                  }`}
                >
                  <UserX aria-hidden="true" />
                  <span>المستخدمون المحذوفون</span>
                </a>
              </li>
            )}
            {renderLink(settingsItem)}
          </ul>
        </nav>

        <div className="sidebar-foot">
          <span className="avatar a1" aria-hidden="true">
            {initials(user?.firstname, user?.lastname)}
          </span>
          <span className="user-meta">
            <span className="user-name">
              {user?.firstname} {user?.lastname}
            </span>
            <span className="user-role">
              {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
            </span>
          </span>
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label="فتح القائمة"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>

          <nav className="crumbs" aria-label="مسار التنقل">
            <a
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
            >
              الرئيسية
            </a>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            {crumbs.parent && (
              <>
                <span>{crumbs.parent}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </>
            )}
            <b aria-current="page">{crumbs.leaf}</b>
          </nav>

          <form className="search-box" role="search" onSubmit={submitSearch}>
            <Search aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث عن موظف بالاسم…"
              aria-label="البحث عن موظف"
            />
            <kbd aria-hidden="true">Ctrl K</kbd>
          </form>
        </header>

        <main className="content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

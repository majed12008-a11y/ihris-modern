import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

/**
 * Sprint 6 — Polish: تجميع عناصر البيانات المرجعية الخمسة تحت قائمة قابلة للطي
 * لتقليل ازدحام الشريط الجانبي (ADR-009 §9.2 القرار 10).
 */

const primaryNavigation = [
  { name: "لوحة التحكم", path: "/dashboard", icon: LayoutDashboard },
  { name: "الموظفون", path: "/persons", icon: Users },
  { name: "المنشآت", path: "/facilities", icon: Building2 },
  { name: "الوظائف", path: "/positions", icon: Briefcase },
  { name: "المسميات الوظيفية", path: "/jobs", icon: Layers },
];

const referenceNavigation = [
  { name: "درجات الرواتب", path: "/reference/salary-grades", icon: Wallet },
  { name: "الفئات الوظيفية", path: "/reference/cadres", icon: UserCog },
  { name: "التصنيفات الوظيفية", path: "/reference/classifications", icon: Tags },
  { name: "أنواع الوظائف", path: "/reference/position-types", icon: Briefcase },
  { name: "مصادر الرواتب", path: "/reference/salary-sources", icon: Landmark },
];

const secondaryNavigation = [
  { name: "الدول", path: "/countries", icon: Globe2 },
  { name: "الرواتب", path: "/salaries", icon: CreditCard },
  { name: "التدريب", path: "/training", icon: BookOpen },
];

const settingsItem = { name: "الإعدادات", path: "/settings", icon: Settings };

const REFERENCE_PREFIX = "/reference/";

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const canListUsers = isAdmin || user?.role === "hr_manager";

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const isReferenceActive = currentPath.startsWith(REFERENCE_PREFIX);

  const [referenceOpen, setReferenceOpen] = useState(true);

  // افتح المجموعة تلقائياً عند الوصول إلى صفحة مرجعية عبر رابط مباشر.
  useEffect(() => {
    if (isReferenceActive) setReferenceOpen(true);
  }, [isReferenceActive]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("ihris_token");
    localStorage.removeItem("ihris_user");
    navigate("/login");
  };

  const renderLink = (item: { name: string; path: string; icon: typeof Settings }, indent = false) => {
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
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            indent ? "rtl:pr-10 ltr:pl-10" : ""
          } ${
            isActive
              ? "bg-primary-100 text-primary-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Icon size={18} />
          {item.name}
        </a>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-600 text-white px-4 py-3 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl">iHRIS Suite</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">
              {user?.firstname} {user?.lastname}
            </span>
            <button onClick={handleLogout} className="hover:opacity-80 transition">
              <LogOut size={20} /> تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow h-[calc(100vh-60px)] fixed rtl:right-0 ltr:left-0 z-50 overflow-y-auto">
          <div className="p-4">
            <ul className="space-y-1">
              {primaryNavigation.map((item) => renderLink(item))}

              <li>
                <button
                  type="button"
                  onClick={() => setReferenceOpen((open) => !open)}
                  aria-expanded={referenceOpen}
                  aria-controls="reference-navigation"
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isReferenceActive
                      ? "bg-primary-100 text-primary-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Database size={18} />
                    البيانات المرجعية
                  </span>
                  {referenceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {referenceOpen && (
                  <ul id="reference-navigation" className="mt-1 space-y-1">
                    {referenceNavigation.map((item) => renderLink(item, true))}
                  </ul>
                )}
              </li>

              {secondaryNavigation.map((item) => renderLink(item))}

              {canListUsers && renderLink({ name: "المستخدمون", path: "/users", icon: Shield })}
              {!canListUsers &&
                user &&
                renderLink({ name: "ملفي الشخصي", path: `/users/${user.id}/edit`, icon: Shield })}
              {isAdmin &&
                renderLink({
                  name: "المستخدمون المحذوفون",
                  path: "/users/deleted",
                  icon: UserX,
                })}
              {renderLink(settingsItem)}
            </ul>
          </div>
        </aside>

        <main className={`rtl:mr-64 ltr:ml-64 p-6 min-h-[calc(100vh-60px)]`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

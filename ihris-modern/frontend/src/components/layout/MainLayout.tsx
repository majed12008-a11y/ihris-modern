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
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const navigation = [
  { name: "لوحة التحكم", path: "/dashboard", icon: LayoutDashboard },
  { name: "الموظفون", path: "/persons", icon: Users },
  { name: "المنشآت", path: "/facilities", icon: Building2 },
  { name: "الوظائف", path: "/positions", icon: Briefcase },
  { name: "المسميات الوظيفية", path: "/jobs", icon: Layers },
  { name: "درجات الرواتب", path: "/reference/salary-grades", icon: Wallet },
  { name: "الفئات الوظيفية", path: "/reference/cadres", icon: UserCog },
  { name: "التصنيفات الوظيفية", path: "/reference/classifications", icon: Tags },
  { name: "أنواع الوظائف", path: "/reference/position-types", icon: Briefcase },
  { name: "مصادر الرواتب", path: "/reference/salary-sources", icon: Landmark },
  { name: "الدول", path: "/countries", icon: Globe2 },
  { name: "الرواتب", path: "/salaries", icon: CreditCard },
  { name: "التدريب", path: "/training", icon: BookOpen },
];

const settingsItem = { name: "الإعدادات", path: "/settings", icon: Settings };

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const canListUsers = isAdmin || user?.role === "hr_manager";

  const items = [...navigation];
  if (canListUsers) {
    items.push({ name: "المستخدمون", path: "/users", icon: Shield });
  } else if (user) {
    // المستخدم العادي يصل إلى تعديل بياناته الشخصية مباشرة (self-edit)
    items.push({ name: "ملفي الشخصي", path: `/users/${user.id}/edit`, icon: Shield });
  }
  if (isAdmin) {
    items.push({ name: "المستخدمون المحذوفون", path: "/users/deleted", icon: UserX });
  }
  items.push(settingsItem);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("ihris_token");
    localStorage.removeItem("ihris_user");
    navigate("/login");
  };

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-600 text-white px-4 py-3 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl">iHRIS Suite</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user?.firstname} {user?.lastname}</span>
            <button onClick={handleLogout} className="hover:opacity-80 transition">
              <LogOut size={20} /> تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow h-[calc(100vh-60px)] fixed rtl:right-0 ltr:left-0 z-50">
          <div className="p-4">
            <ul className="space-y-1">
              {items.map((item) => {
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
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
              })}
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

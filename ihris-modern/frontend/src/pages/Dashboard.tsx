import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Users, Building, Briefcase, CreditCard, BookOpen, Shield } from "lucide-react";

interface DashboardStats {
  total_persons: number;
  total_positions: number;
  total_facilities: number;
  total_salaries: number;
  total_training_courses: number;
  total_users: number;
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        // جلب إحصائيات من نقاط نهاية متعددة
        const [personsRes, positionsRes, facilitiesRes, salariesRes, trainingRes, usersRes] =
          await Promise.all([
            api.get("/persons?limit=1"),
            api.get("/positions?limit=1"),
            api.get("/facilities"),
            api.get("/salaries?limit=1"),
            api.get("/training/courses"),
            api.get("/users?limit=1"),
          ]);

        return {
          total_persons: personsRes.data.total || 0,
          total_positions: positionsRes.data.total || 0,
          total_facilities: facilitiesRes.data.total || 0,
          total_salaries: salariesRes.data.total || 0,
          total_training_courses: trainingRes.data.length || 0,
          total_users: usersRes.data.total || 0,
        };
      } catch (err: any) {
        console.error("❌ Error fetching dashboard stats:", err);
        throw err;
      }
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("❌ Dashboard error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <div className="text-red-600 font-bold mb-2">⚠️ حدث خطأ في تحميل البيانات</div>
          <p className="text-gray-600 text-sm mb-4">{error instanceof Error ? error.message : String(error)}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "إجمالي الموظفين", value: stats?.total_persons || 0, icon: Users, color: "text-blue-600" },
    { label: "الوظائف الشاغرة", value: stats?.total_positions || 0, icon: Briefcase, color: "text-green-600" },
    { label: "المنشآت الصحية", value: stats?.total_facilities || 0, icon: Building, color: "text-purple-600" },
    { label: "السجلات المالية", value: stats?.total_salaries || 0, icon: CreditCard, color: "text-orange-600" },
    { label: "الدورات التدريبية", value: stats?.total_training_courses || 0, icon: BookOpen, color: "text-indigo-600" },
    { label: "المستخدمين", value: stats?.total_users || 0, icon: Shield, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <p className="text-gray-600">نظرة عامة على موارد النظام البشرية</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-${card.color.replace("text-", "bg-")}-100 flex items-center justify-center`}>
                <card.icon size={20} className={`${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => {
              // سيتم إضافة التنقل لصفحة إضافة موظف
            }}
            className="bg-primary-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition flex items-center gap-2"
          >
            <Users size={16} /> إضافة موظف جديد
          </button>
          <button
            className="bg-primary-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition flex items-center gap-2"
          >
            <Briefcase size={16} /> إضافة وظيفة شاغرة
          </button>
          <button
            className="bg-primary-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition flex items-center gap-2"
          >
            <CreditCard size={16} /> إضافة راتب جديد
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-lg font-bold mb-4">آخر التحديثات</h2>
        <p className="text-gray-500 text-sm">لا توجد تحديثات حديثة. ابدأ بإضافة بيانات الموظفين والوظائف.</p>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { BookOpen, GraduationCap, Building2, Users, Plus } from "lucide-react";

interface TrainingCourse {
  id: number;
  name: string;
  topic: string | null;
  notes: string | null;
  trainingInstitution: { id: number; name: string } | null;
  scheduledCourses: Array<{
    id: number;
    site: string | null;
    startDate: string | null;
    endDate: string | null;
    personScheduled: Array<{
      id: number;
      person: { id: number; surname: string; firstname: string };
    }>;
  }>;
}

interface Institution {
  id: number;
  name: string;
}

interface Status {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Training() {
  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery<TrainingCourse[]>({
    queryKey: ["training-courses"],
    queryFn: async () => {
      const res = await api.get("/training/courses");
      return res.data;
    },
  });

  const { data: institutions, isLoading: instLoading, error: instError } = useQuery<Institution[]>({
    queryKey: ["training-institutions"],
    queryFn: async () => {
      const res = await api.get("/training/institutions");
      return res.data;
    },
  });

  const { data: statuses, isLoading: statusLoading, error: statusError } = useQuery<Status[]>({
    queryKey: ["training-statuses"],
    queryFn: async () => {
      const res = await api.get("/training/statuses");
      return res.data;
    },
  });

  const { data: categories, isLoading: catLoading, error: catError } = useQuery<Category[]>({
    queryKey: ["training-categories"],
    queryFn: async () => {
      const res = await api.get("/training/categories");
      return res.data;
    },
  });

  const isLoading = coursesLoading || instLoading || statusLoading || catLoading;
  const error = coursesError || instError || statusError || catError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل بيانات التدريب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("❌ Training error:", error);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة التدريب</h1>
          <p className="text-gray-600">الدورات التدريبية، المؤسسات، والمتسجلين</p>
        </div>

        <button
          onClick={() => {
            console.log("🔘 Clicked Add Training button");
            alert("سيتم إضافة نموذج إضافة دورة تدريبية قريباً");
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
        >
          <Plus size={18} /> دورة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">الدورات التدريبية</p>
              <p className="text-2xl font-bold text-primary-600">
                {courses?.length || 0}
              </p>
            </div>
            <GraduationCap size={32} className="text-primary-100 bg-primary-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المؤسسات التدريبية</p>
              <p className="text-2xl font-bold text-primary-600">
                {institutions?.length || 0}
              </p>
            </div>
            <Building2 size={32} className="text-primary-100 bg-primary-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">حالات الدورات</p>
              <p className="text-2xl font-bold text-primary-600">
                {statuses?.length || 0}
              </p>
            </div>
            <BookOpen size={32} className="text-primary-100 bg-primary-50 p-2 rounded-lg" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">تصنيفات الدورات</p>
              <p className="text-2xl font-bold text-primary-600">
                {categories?.length || 0}
              </p>
            </div>
            <Users size={32} className="text-primary-100 bg-primary-50 p-2 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <h2 className="px-6 py-4 text-lg font-bold border-b border-gray-100">الدورات التدريبية</h2>
        <div className="p-6">
          {(courses?.length || 0) > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">اسم الدورة</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">الموضوع</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">المؤسسة</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">المسجلون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(courses || []).map((course: TrainingCourse) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">{course.name}</td>
                    <td className="px-6 py-4 text-gray-600">{course.topic || "-"}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {course.trainingInstitution?.name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        مجدولة
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {course.scheduledCourses.reduce(
                        (acc: number, sc: any) => acc + sc.personScheduled.length,
                        0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد دورات تدريبية
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

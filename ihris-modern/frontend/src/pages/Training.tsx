import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import {
  BookOpen,
  GraduationCap,
  Building2,
  Users,
  Plus,
  Pencil,
  Trash2,
  CalendarPlus,
  ClipboardList,
  AlertTriangle,
  X,
} from "lucide-react";

interface EnrolledPerson {
  id: number;
  person: { id: number; surname: string; firstname: string };
}

interface ScheduledCourse {
  id: number;
  trainingCourseId: number;
  site: string | null;
  numStudents: number | null;
  instructors: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  version: number;
  personScheduled: EnrolledPerson[];
}

interface TrainingCourse {
  id: number;
  name: string;
  topic: string | null;
  notes: string | null;
  version: number;
  trainingInstitution: { id: number; name: string } | null;
  trainingCourseStatus: { id: number; name: string } | null;
  trainingCourseCategory: { id: number; name: string } | null;
  scheduledCourses: ScheduledCourse[];
}

interface Institution {
  id: number;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  planning: "قيد التخطيط",
  scheduled: "مجدولة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function errorToText(error: unknown): string {
  return extractErrorMessages(error).join(" — ");
}

export default function Training() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canWrite =
    user?.role === "admin" || user?.role === "hr_manager" || user?.role === "training_manager";
  const [deleteTarget, setDeleteTarget] = useState<TrainingCourse | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);

  const coursesQuery = useQuery<TrainingCourse[]>({
    queryKey: ["training-courses"],
    queryFn: async () => (await api.get("/training/courses")).data,
  });
  const institutionsQuery = useQuery<Institution[]>({
    queryKey: ["training-institutions"],
    queryFn: async () => (await api.get("/training/institutions")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (course: TrainingCourse) =>
      (await api.delete(`/training/courses/${course.id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      toast.success("تم حذف الدورة التدريبية");
      setDeleteTarget(null);
      setDeleteErrors([]);
    },
    onError: (error) => {
      setDeleteErrors(extractErrorMessages(error));
    },
  });

  const isLoading = coursesQuery.isLoading || institutionsQuery.isLoading;
  const error = coursesQuery.error || institutionsQuery.error;

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <div className="text-red-600 font-bold mb-2">⚠️ حدث خطأ في تحميل البيانات</div>
          <p className="text-gray-600 text-sm mb-4">{errorToText(error)}</p>
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

  const courses = coursesQuery.data ?? [];
  const institutions = institutionsQuery.data ?? [];
  const scheduled = courses.flatMap((course) =>
    course.scheduledCourses.map((item) => ({ ...item, courseName: course.name }))
  );
  const totalEnrolled = scheduled.reduce((sum, item) => sum + item.personScheduled.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة التدريب</h1>
          <p className="text-gray-600">الدورات التدريبية، المؤسسات، الدورات المجدولة والمتسجلون</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/training/institutions"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-gray-50 transition"
          >
            <Building2 size={18} /> المؤسسات التدريبية
          </Link>
          {canWrite && (
            <Link
              to="/training/new"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
            >
              <Plus size={18} /> دورة جديدة
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "الدورات التدريبية", value: courses.length, icon: GraduationCap },
          { label: "المؤسسات التدريبية", value: institutions.length, icon: Building2 },
          { label: "الدورات المجدولة", value: scheduled.length, icon: BookOpen },
          { label: "المتدربون المسجلون", value: totalEnrolled, icon: Users },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white p-6 rounded-xl shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-primary-600">{card.value}</p>
                </div>
                <Icon size={32} className="text-primary-100 bg-primary-50 p-2 rounded-lg" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <h2 className="px-6 py-4 text-lg font-bold border-b border-gray-100">الدورات التدريبية</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">اسم الدورة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الموضوع</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">المؤسسة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">التصنيف</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإصدار</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium">
                    <div>{course.name}</div>
                    <div className="text-xs text-gray-500">
                      {course.trainingCourseStatus?.name ?? "بدون حالة"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{course.topic || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {course.trainingInstitution?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {course.trainingCourseCategory?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">v{course.version}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {canWrite && (
                        <>
                          <Link
                            to={`/training/courses/${course.id}/edit`}
                            className="text-primary-600 hover:text-primary-800 p-1"
                            title="تعديل"
                          >
                            <Pencil size={18} />
                          </Link>
                          <Link
                            to={`/training/courses/${course.id}/schedule/new`}
                            className="text-emerald-600 hover:text-emerald-800 p-1"
                            title="جدولة دورة"
                          >
                            <CalendarPlus size={18} />
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteTarget(course);
                              setDeleteErrors([]);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!courses.length && (
          <div className="text-center py-12 text-gray-500">لا توجد دورات تدريبية</div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <h2 className="px-6 py-4 text-lg font-bold border-b border-gray-100">الدورات المجدولة</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الدورة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الموقع</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الفترة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الحالة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">المتدربون</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scheduled.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium">{item.courseName}</td>
                  <td className="px-6 py-4 text-gray-600">{item.site || "—"}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {item.startDate ? new Date(item.startDate).toLocaleDateString("ar") : "—"}
                    {" — "}
                    {item.endDate ? new Date(item.endDate).toLocaleDateString("ar") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        STATUS_STYLES[item.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.personScheduled.length}
                    {item.numStudents ? ` / ${item.numStudents}` : ""}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/training/scheduled/${item.id}/enrollments`}
                      className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 text-sm font-medium"
                    >
                      <ClipboardList size={16} /> المتدربون
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!scheduled.length && (
          <div className="text-center py-12 text-gray-500">لا توجد دورات مجدولة بعد</div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-2 rounded-full">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">تأكيد الحذف</h2>
                  <button
                    onClick={() => {
                      setDeleteTarget(null);
                      setDeleteErrors([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  سيُحذف <span className="font-bold">{deleteTarget.name}</span> حذفاً ناعماً.
                  لا يمكن الحذف إذا كانت له دورة مجدولة.
                </p>
              </div>
            </div>

            {deleteErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm space-y-1">
                {deleteErrors.map((message, index) => (
                  <div key={index}>• {message}</div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteErrors([]);
                }}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

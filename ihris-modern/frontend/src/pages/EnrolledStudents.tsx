import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
  Search,
  AlertTriangle,
  X,
  Pencil,
} from "lucide-react";

/**
 * Sprint 6 / GAP-H-002 — إدارة المتدربين في دورة مجدولة.
 * التسجيل/الإتمام/الحذف للكتابة فقط (admin, hr_manager, training_manager).
 */

interface Enrollment {
  id: number;
  personId: number;
  completed: boolean;
  isRetraining: boolean;
  requestDate: string | null;
  notes: string | null;
  person: { id: number; surname: string; firstname: string; othername: string | null };
}

interface ScheduledDetail {
  id: number;
  site: string | null;
  numStudents: number | null;
  instructors: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  version: number;
  trainingCourse: { id: number; name: string } | null;
  personScheduled: Enrollment[];
}

interface PersonRow {
  id: number;
  surname: string;
  firstname: string;
  othername: string | null;
}

interface PersonListResponse {
  data: PersonRow[];
  total: number;
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

function fullName(person: { surname: string; firstname: string; othername?: string | null }) {
  return [person.firstname, person.othername, person.surname].filter(Boolean).join(" ");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("ar") : "—";
}

export default function EnrolledStudents() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canWrite =
    user?.role === "admin" || user?.role === "hr_manager" || user?.role === "training_manager";

  const [personSearch, setPersonSearch] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [notes, setNotes] = useState("");
  const [actionErrors, setActionErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);

  const scheduledQuery = useQuery<ScheduledDetail>({
    queryKey: ["training-scheduled", id],
    queryFn: async () => (await api.get(`/training/scheduled/${id}`)).data,
  });

  const enrollmentsQuery = useQuery<Enrollment[]>({
    queryKey: ["training-enrollments", id],
    queryFn: async () => (await api.get(`/training/scheduled/${id}/enrollments`)).data,
  });

  const peopleQuery = useQuery<PersonListResponse>({
    queryKey: ["persons-for-enrollment", personSearch],
    queryFn: async () =>
      (await api.get("/persons", { params: { search: personSearch || undefined, limit: 25 } }))
        .data,
    enabled: canWrite,
  });

  const scheduled = scheduledQuery.data;
  const enrollments = enrollmentsQuery.data ?? [];
  const isClosed = scheduled?.status === "completed" || scheduled?.status === "cancelled";

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.personId)),
    [enrollments]
  );
  const candidates = (peopleQuery.data?.data ?? []).filter(
    (person) => !enrolledIds.has(person.id)
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["training-enrollments", id] });
    queryClient.invalidateQueries({ queryKey: ["training-scheduled", id] });
    queryClient.invalidateQueries({ queryKey: ["training-courses"] });
  };

  const enrollMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/training/scheduled/${id}/enroll`, {
          personId: Number(selectedPersonId),
          notes: notes.trim() || null,
        })
      ).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم تسجيل المتدرب");
      setSelectedPersonId("");
      setNotes("");
      setActionErrors([]);
    },
    onError: (error) => setActionErrors(extractErrorMessages(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: async (enrollment: Enrollment) =>
      (
        await api.put(`/training/enrollments/${enrollment.id}`, {
          completed: !enrollment.completed,
        })
      ).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم تحديث حالة المتدرب");
      setActionErrors([]);
    },
    onError: (error) => setActionErrors(extractErrorMessages(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (enrollment: Enrollment) =>
      (await api.delete(`/training/enrollments/${enrollment.id}`)).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم حذف التسجيل");
      setDeleteTarget(null);
      setActionErrors([]);
    },
    onError: (error) => {
      setActionErrors(extractErrorMessages(error));
      setDeleteTarget(null);
    },
  });

  if (scheduledQuery.isLoading) {
    return <div className="text-center py-12 text-gray-500">جاري تحميل بيانات الدورة...</div>;
  }

  if (scheduledQuery.error || !scheduled) {
    return (
      <div className="text-center py-12 text-red-600">
        {scheduledQuery.error
          ? extractErrorMessages(scheduledQuery.error).join(" — ")
          : "الدورة المجدولة غير موجودة"}
      </div>
    );
  }

  const completedCount = enrollments.filter((enrollment) => enrollment.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/training"
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> التدريب
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            متدربو الدورة: {scheduled.trainingCourse?.name ?? "—"}
          </h1>
          <p className="text-gray-600">
            {scheduled.site || "بدون موقع"} — {formatDate(scheduled.startDate)} إلى{" "}
            {formatDate(scheduled.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-sm rounded-full ${
              STATUS_STYLES[scheduled.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {STATUS_LABELS[scheduled.status] ?? scheduled.status}
          </span>
          {canWrite && (
            <Link
              to={`/training/scheduled/${scheduled.id}/edit`}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-gray-50 transition"
            >
              <Pencil size={18} /> تعديل الجدولة
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "المسجّلون", value: enrollments.length, icon: Users },
          { label: "أتمّوا الدورة", value: completedCount, icon: CheckCircle2 },
          {
            label: "المستهدف",
            value: scheduled.numStudents ?? "—",
            icon: Circle,
          },
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

      {actionErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">تعذر تنفيذ العملية</span>
            <button onClick={() => setActionErrors([])} className="text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
          {actionErrors.map((message, index) => (
            <div key={index}>• {message}</div>
          ))}
        </div>
      )}

      {canWrite && (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-primary-600" /> تسجيل متدرب
          </h2>

          {isClosed ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              لا يمكن التسجيل: الدورة {STATUS_LABELS[scheduled.status] ?? scheduled.status}.
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setActionErrors([]);
                if (!selectedPersonId) {
                  setActionErrors(["اختر متدرباً أولاً"]);
                  return;
                }
                enrollMutation.mutate();
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
            >
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  بحث عن شخص
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={personSearch}
                    onChange={(event) => setPersonSearch(event.target.value)}
                    placeholder="الاسم أو اللقب..."
                    className="w-full pr-9 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الشخص *
                </label>
                <select
                  value={selectedPersonId}
                  onChange={(event) => setSelectedPersonId(event.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">
                    {peopleQuery.isLoading
                      ? "جارٍ التحميل..."
                      : candidates.length
                        ? "اختر شخصاً"
                        : "لا يوجد أشخاص متاحون"}
                  </option>
                  {candidates.map((person) => (
                    <option key={person.id} value={person.id}>
                      {fullName(person)} (#{person.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  {enrollMutation.isPending ? "جارٍ التسجيل..." : "تسجيل المتدرب"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <h2 className="px-6 py-4 text-lg font-bold border-b border-gray-100">
          قائمة المتدربين ({enrollments.length})
        </h2>

        {enrollmentsQuery.isLoading ? (
          <div className="text-center py-12 text-gray-500">جاري تحميل المتدربين...</div>
        ) : enrollmentsQuery.error ? (
          <div className="text-center py-12 text-red-600">
            {extractErrorMessages(enrollmentsQuery.error).join(" — ")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">المتدرب</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">تاريخ الطلب</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">ملاحظات</th>
                  {canWrite && (
                    <th className="px-6 py-3 text-sm font-semibold text-gray-700">إجراءات</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">
                      {fullName(enrollment.person)}
                      <div className="text-xs text-gray-500">#{enrollment.personId}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {formatDate(enrollment.requestDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          enrollment.completed
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {enrollment.completed ? "أتمّ الدورة" : "قيد المشاركة"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {enrollment.notes || "—"}
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleMutation.mutate(enrollment)}
                            disabled={toggleMutation.isPending}
                            className={`p-1 ${
                              enrollment.completed
                                ? "text-amber-600 hover:text-amber-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                            title={enrollment.completed ? "إلغاء الإتمام" : "تأكيد الإتمام"}
                          >
                            {enrollment.completed ? (
                              <Circle size={18} />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(enrollment);
                              setActionErrors([]);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="حذف التسجيل"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!enrollmentsQuery.isLoading && !enrollments.length && (
          <div className="text-center py-12 text-gray-500">لا يوجد متدربون مسجّلون بعد</div>
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
                  <h2 className="text-xl font-bold text-gray-800">تأكيد حذف التسجيل</h2>
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  سيُحذف تسجيل{" "}
                  <span className="font-bold">{fullName(deleteTarget.person)}</span> من هذه الدورة.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
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

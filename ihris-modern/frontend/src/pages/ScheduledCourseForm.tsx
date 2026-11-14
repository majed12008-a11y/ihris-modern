import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import { Save, ArrowLeft, X, CalendarPlus } from "lucide-react";

/**
 * Sprint 6 / GAP-H-001 — نموذج الدورة المجدولة (إنشاء + تعديل).
 * المسارات:
 *   /training/courses/:courseId/schedule/new   → إنشاء
 *   /training/scheduled/:scheduledId/edit      → تعديل (مع version)
 */

interface ScheduledFormData {
  site: string;
  numStudents: string;
  instructors: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: string;
}

const EMPTY: ScheduledFormData = {
  site: "",
  numStudents: "",
  instructors: "",
  startDate: "",
  endDate: "",
  notes: "",
  status: "scheduled",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "قيد التخطيط",
  scheduled: "مجدولة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

// آلة الحالة مطابقة لـ STATUS_TRANSITIONS في الخدمة الخلفية.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  planning: ["scheduled", "cancelled"],
  scheduled: ["completed", "cancelled", "planning"],
  completed: [],
  cancelled: ["planning"],
};

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toNullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export default function ScheduledCourseForm() {
  const { courseId, scheduledId } = useParams<{
    courseId?: string;
    scheduledId?: string;
  }>();
  const isEdit = Boolean(scheduledId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ScheduledFormData>(EMPTY);
  const [version, setVersion] = useState(1);
  const [currentStatus, setCurrentStatus] = useState("scheduled");
  const [errors, setErrors] = useState<string[]>([]);

  const courseQuery = useQuery({
    queryKey: ["training-course", courseId],
    enabled: Boolean(courseId) && !isEdit,
    queryFn: async () => (await api.get(`/training/courses/${courseId}`)).data,
  });

  const scheduledQuery = useQuery({
    queryKey: ["training-scheduled", scheduledId],
    enabled: isEdit,
    queryFn: async () => (await api.get(`/training/scheduled/${scheduledId}`)).data,
  });

  useEffect(() => {
    if (!isEdit || !scheduledQuery.data) return;
    const item = scheduledQuery.data;
    setFormData({
      site: item.site ?? "",
      numStudents: item.numStudents !== null && item.numStudents !== undefined
        ? String(item.numStudents)
        : "",
      instructors: item.instructors ?? "",
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
      notes: item.notes ?? "",
      status: item.status ?? "scheduled",
    });
    setVersion(item.version ?? 1);
    setCurrentStatus(item.status ?? "scheduled");
  }, [isEdit, scheduledQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        site: toNullableText(formData.site),
        numStudents: toNullableNumber(formData.numStudents),
        instructors: toNullableText(formData.instructors),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        notes: toNullableText(formData.notes),
      };

      if (isEdit) {
        body.version = version;
        // أرسل الحالة فقط إذا تغيّرت (لتفادي 422 انتقال غير مسموح).
        if (formData.status !== currentStatus) body.status = formData.status;
        return (await api.put(`/training/scheduled/${scheduledId}`, body)).data;
      }

      body.trainingCourseId = Number(courseId);
      if (formData.status) body.status = formData.status;
      return (await api.post("/training/scheduled", body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      queryClient.invalidateQueries({ queryKey: ["training-scheduled"] });
      toast.success(isEdit ? "تم تحديث الدورة المجدولة" : "تمت جدولة الدورة");
      const target = isEdit
        ? scheduledId
        : (scheduledQuery.data?.id as number | undefined);
      if (target) navigate(`/training/scheduled/${target}/enrollments`);
      else navigate("/training");
    },
    onError: (error) => setErrors(extractErrorMessages(error)),
  });

  const set = (key: keyof ScheduledFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [key]: event.target.value }));

  const courseName = isEdit
    ? scheduledQuery.data?.trainingCourse?.name
    : courseQuery.data?.name;

  const statusOptions = isEdit
    ? [currentStatus, ...(ALLOWED_TRANSITIONS[currentStatus] ?? [])]
    : ["planning", "scheduled"];

  const loading = (isEdit && scheduledQuery.isLoading) || (!isEdit && courseQuery.isLoading);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/training")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل دورة مجدولة" : "جدولة دورة تدريبية"}
          </h1>
          <p className="text-gray-600">
            {courseName ? `الدورة: ${courseName}` : ""}
            {isEdit ? ` — الإصدار v${version}` : ""}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        {loading && <div className="text-gray-600 mb-4">جارٍ تحميل البيانات...</div>}

        {errors.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">تعذر الحفظ</span>
              <button onClick={() => setErrors([])} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
            {errors.map((message, index) => (
              <div key={index}>• {message}</div>
            ))}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setErrors([]);
            if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
              setErrors(["تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية"]);
              return;
            }
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
              <input
                type="text"
                value={formData.site}
                onChange={set("site")}
                maxLength={255}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عدد المتدربين المستهدف
              </label>
              <input
                type="number"
                min={0}
                value={formData.numStudents}
                onChange={set("numStudents")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المدربون</label>
              <input
                type="text"
                value={formData.instructors}
                onChange={set("instructors")}
                maxLength={255}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={set("startDate")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={set("endDate")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={formData.status}
                onChange={set("status")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] ?? status}
                  </option>
                ))}
              </select>
              {isEdit && !(ALLOWED_TRANSITIONS[currentStatus] ?? []).length && (
                <p className="text-xs text-gray-500 mt-1">
                  الدورة مكتملة — لا توجد انتقالات حالة متاحة.
                </p>
              )}
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">الملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={set("notes")}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              {isEdit ? <Save size={18} /> : <CalendarPlus size={18} />}
              {saveMutation.isPending
                ? "جارٍ الحفظ..."
                : isEdit
                  ? "حفظ التعديلات"
                  : "جدولة الدورة"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/training")}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

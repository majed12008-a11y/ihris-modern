import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import { Save, ArrowLeft, X } from "lucide-react";

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

interface TrainingFormData {
  name: string;
  topic: string;
  notes: string;
  trainingInstitutionId: string;
  trainingFunder: string;
  continuingEducationCourse: string;
  trainingCourseStatusId: string;
  trainingCourseCategoryId: string;
  competency: string;
}

const EMPTY: TrainingFormData = {
  name: "",
  topic: "",
  notes: "",
  trainingInstitutionId: "",
  trainingFunder: "",
  continuingEducationCourse: "",
  trainingCourseStatusId: "",
  trainingCourseCategoryId: "",
  competency: "",
};

function toNullableNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export default function TrainingForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TrainingFormData>(EMPTY);
  const [version, setVersion] = useState<number>(1);
  const [errors, setErrors] = useState<string[]>([]);

  const institutionsQuery = useQuery<Institution[]>({
    queryKey: ["training-institutions"],
    queryFn: async () => (await api.get("/training/institutions")).data,
  });
  const statusesQuery = useQuery<Status[]>({
    queryKey: ["training-statuses"],
    queryFn: async () => (await api.get("/training/statuses")).data,
  });
  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["training-categories"],
    queryFn: async () => (await api.get("/training/categories")).data,
  });

  const courseQuery = useQuery({
    queryKey: ["training-course", id],
    enabled: isEdit,
    queryFn: async () => (await api.get(`/training/courses/${id}`)).data,
  });

  useEffect(() => {
    if (!isEdit || !courseQuery.data) return;
    const course = courseQuery.data;
    setFormData({
      name: course.name ?? "",
      topic: course.topic ?? "",
      notes: course.notes ?? "",
      trainingInstitutionId: course.trainingInstitutionId
        ? String(course.trainingInstitutionId)
        : "",
      trainingFunder: course.trainingFunder ?? "",
      continuingEducationCourse: course.continuingEducationCourse ?? "",
      trainingCourseStatusId: course.trainingCourseStatusId
        ? String(course.trainingCourseStatusId)
        : "",
      trainingCourseCategoryId: course.trainingCourseCategoryId
        ? String(course.trainingCourseCategoryId)
        : "",
      competency: course.competency ?? "",
    });
    setVersion(course.version ?? 1);
  }, [isEdit, courseQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: formData.name.trim(),
        topic: toNullableText(formData.topic),
        notes: toNullableText(formData.notes),
        trainingInstitutionId: toNullableNumber(formData.trainingInstitutionId),
        trainingFunder: toNullableText(formData.trainingFunder),
        continuingEducationCourse: toNullableText(formData.continuingEducationCourse),
        trainingCourseStatusId: toNullableNumber(formData.trainingCourseStatusId),
        trainingCourseCategoryId: toNullableNumber(formData.trainingCourseCategoryId),
        competency: toNullableText(formData.competency),
      };
      if (isEdit) {
        body.version = version;
        return (await api.put(`/training/courses/${id}`, body)).data;
      }
      return (await api.post("/training/courses", body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      queryClient.invalidateQueries({ queryKey: ["training-course", id] });
      toast.success(isEdit ? "تم تحديث الدورة التدريبية" : "تمت إضافة الدورة التدريبية");
      navigate("/training");
    },
    onError: (error) => {
      setErrors(extractErrorMessages(error));
    },
  });

  const set = (key: keyof TrainingFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [key]: event.target.value }));

  const institutions = institutionsQuery.data ?? [];
  const statuses = statusesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

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
            {isEdit ? "تعديل دورة تدريبية" : "إضافة دورة تدريبية"}
          </h1>
          <p className="text-gray-600">
            {isEdit ? `الإصدار الحالي: v${version}` : "تسجيل دورة تدريبية جديدة في النظام"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        {courseQuery.isLoading && isEdit && (
          <div className="text-gray-600 mb-4">جارٍ تحميل بيانات الدورة...</div>
        )}

        {errors.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">تعذر حفظ الدورة</span>
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
            if (!formData.name.trim()) {
              setErrors(["اسم الدورة مطلوب"]);
              return;
            }
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الدورة *</label>
              <input
                type="text"
                value={formData.name}
                onChange={set("name")}
                maxLength={255}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
              <input
                type="text"
                value={formData.topic}
                onChange={set("topic")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المؤسسة التدريبية
              </label>
              <select
                value={formData.trainingInstitutionId}
                onChange={set("trainingInstitutionId")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">بدون مؤسسة</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الممول</label>
              <input
                type="text"
                value={formData.trainingFunder}
                onChange={set("trainingFunder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حالة الدورة</label>
              <select
                value={formData.trainingCourseStatusId}
                onChange={set("trainingCourseStatusId")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">بدون حالة</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <select
                value={formData.trainingCourseCategoryId}
                onChange={set("trainingCourseCategoryId")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">بدون تصنيف</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                دورة التعليم المستمر
              </label>
              <input
                type="text"
                value={formData.continuingEducationCourse}
                onChange={set("continuingEducationCourse")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجدارة</label>
              <input
                type="text"
                value={formData.competency}
                onChange={set("competency")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
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
              <Save size={18} />
              {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ الدورة التدريبية"}
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

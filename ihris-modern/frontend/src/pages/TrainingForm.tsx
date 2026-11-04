import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

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

export default function TrainingForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TrainingFormData>({
    name: "",
    topic: "",
    notes: "",
    trainingInstitutionId: "",
    trainingFunder: "",
    continuingEducationCourse: "",
    trainingCourseStatusId: "",
    trainingCourseCategoryId: "",
    competency: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: TrainingFormData) => {
      const res = await api.post("/training/courses", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      toast.success("تم إضافة الدورة التدريبية بنجاح");
      navigate("/training");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إضافة الدورة التدريبية");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

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
          <h1 className="text-2xl font-bold text-gray-800">إضافة دورة تدريبية</h1>
          <p className="text-gray-600">
            تسجيل دورة تدريبية جديدة في النظام
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-lg-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الدورة *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموضوع
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المؤسسة التدريبية
              </label>
              <select
                value={formData.trainingInstitutionId}
                onChange={(e) =>
                  setFormData({ ...formData, trainingInstitutionId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المؤسسة</option>
                <option value="1">مركز التدريب الصحي بصنعاء</option>
                <option value="2">الأكاديمية الطبية العربية</option>
                <option value="3">معهد التمريض</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الممول
              </label>
              <input
                type="text"
                value={formData.trainingFunder}
                onChange={(e) =>
                  setFormData({ ...formData, trainingFunder: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حالة الدورة
              </label>
              <select
                value={formData.trainingCourseStatusId}
                onChange={(e) =>
                  setFormData({ ...formData, trainingCourseStatusId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر الحالة</option>
                <option value="1">مجدول</option>
                <option value="2">مكتمل</option>
                <option value="3">ملغي</option>
                <option value="4">قيد التخطيط</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التصنيف
              </label>
              <select
                value={formData.trainingCourseCategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, trainingCourseCategoryId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر التصنيف</option>
                <option value="1">طبي</option>
                <option value="2">إداري</option>
                <option value="3">تمريضي</option>
                <option value="4">فني</option>
              </select>
            </div>

            <div className="col-span-lg-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              <Save size={18} />
              حفظ الدورة التدريبية
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

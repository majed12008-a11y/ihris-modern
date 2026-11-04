import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { Position } from "@/types";

interface PositionFormData {
  code: string;
  title: string;
  description: string;
  jobId: string;
  facilityId: string;
  departmentId: string;
  proposedSalary: string;
  statusId: string;
}

export default function PositionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const positionId = id ? parseInt(id, 10) : null;
  const isEdit = !!positionId;

  const [formData, setFormData] = useState<PositionFormData>({
    code: "",
    title: "",
    description: "",
    jobId: "",
    facilityId: "",
    departmentId: "",
    proposedSalary: "",
    statusId: "",
  });

  const { data: position, isLoading } = useQuery<Position>({
    queryKey: ["position", positionId],
    queryFn: async () => {
      const res = await api.get(`/positions/${positionId}`);
      return res.data;
    },
    enabled: !!positionId,
  });

  useEffect(() => {
    if (position) {
      setFormData({
        code: position.code || "",
        title: position.title || "",
        description: position.description || "",
        jobId: String(position.jobId || ""),
        facilityId: String(position.facilityId || ""),
        departmentId: String(position.departmentId || ""),
        proposedSalary: position.proposedSalary || "",
        statusId: String(position.statusId || ""),
      });
    }
  }, [position]);

  const updateMutation = useMutation({
    mutationFn: async (data: PositionFormData) => {
      const res = await api.put(`/positions/${positionId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("تم تحديث الوظيفة بنجاح");
      navigate(`/positions/${positionId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث الوظيفة");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PositionFormData) => {
      const res = await api.post("/positions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("تم إضافة الوظيفة بنجاح");
      navigate("/positions");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إضافة الوظيفة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && positionId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading && positionId) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            navigate(isEdit ? `/positions/${positionId}` : "/positions")
          }
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل وظيفة" : "إضافة وظيفة جديدة"}
          </h1>
          <p className="text-gray-600">
            {isEdit
              ? "تعديل بيانات الوظيفة المحددة"
              : "إدخال وظيفة جديدة في الهيكل التنظيمي"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كود الوظيفة
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="مثل: POS-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المسمى الوظيفي *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الراتب المقترح
              </label>
              <input
                type="text"
                value={formData.proposedSalary}
                onChange={(e) =>
                  setFormData({ ...formData, proposedSalary: e.target.value })
                }
                placeholder="مثل: 150,000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المسمى الوظيفي (Job)
              </label>
              <select
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المسمى</option>
                <option value="1">طبيب عام</option>
                <option value="2">ممرض</option>
                <option value="3">صيدلي</option>
                <option value="4">إداري</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المنشأة
              </label>
              <select
                value={formData.facilityId}
                onChange={(e) =>
                  setFormData({ ...formData, facilityId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المنشأة</option>
                <option value="1">مستشفى صنعاء العام</option>
                <option value="2">مركز صحي عدن</option>
                <option value="3">عيادة متخصصة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                القسم
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر القسم</option>
                <option value="1">الإدارة</option>
                <option value="2">الطب العام</option>
                <option value="3">جراحة العظام</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حالة المنصب
              </label>
              <select
                value={formData.statusId}
                onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر الحالة</option>
                <option value="1">شاغر</option>
                <option value="2">مشغول</option>
                <option value="3">تحت الإجراء</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={
                updateMutation.isPending || createMutation.isPending
              }
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              <Save size={18} />
              {isEdit ? "تحديث البيانات" : "حفظ الوظيفة"}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(isEdit ? `/positions/${positionId}` : "/positions")
              }
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

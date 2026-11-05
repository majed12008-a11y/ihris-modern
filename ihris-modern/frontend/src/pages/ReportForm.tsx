import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

interface ReportFormData {
  name: string;
  description: string;
  type: string;
  definition: any;
  isEnabled: boolean;
}

interface ReportDetail {
  id: number;
  name: string;
  description: string | null;
  type: string;
  definition: any;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportId = id ? parseInt(id, 10) : null;
  const isEdit = !!reportId;

  const [formData, setFormData] = useState<ReportFormData>({
    name: "",
    description: "",
    type: "list",
    definition: {},
    isEnabled: true,
  });

  const { data: report, isLoading } = useQuery<ReportDetail>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const res = await api.get(`/reports/${reportId}`);
      return res.data;
    },
    enabled: !!reportId,
  });

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        description: report.description || "",
        type: report.type,
        definition: report.definition || {},
        isEnabled: report.isEnabled,
      });
    }
  }, [report]);

  const createMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const res = await api.post("/reports", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم إنشاء التقرير بنجاح");
      navigate("/reports");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إنشاء التقرير");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const res = await api.put(`/reports/${reportId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      toast.success("تم تحديث التقرير بنجاح");
      navigate("/reports");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث التقرير");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && reportId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading && reportId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/reports")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة إلى التقارير
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل تقرير" : "إضافة تقرير جديد"}
          </h1>
          <p className="text-gray-600">
            {isEdit ? "تعديل تقرير موجود" : "إنشاء تقرير مخصص جديد"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم التقرير *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع التقرير *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="list">قائمة</option>
                <option value="table">جدول</option>
                <option value="pie">رسم بياني دائري</option>
                <option value="bar">رسم بياني شريطي</option>
                <option value="line">رسم بياني خطي</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تعريف التقرير (JSON)
              </label>
              <textarea
                value={JSON.stringify(formData.definition, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData({ ...formData, definition: parsed });
                  } catch {
                    // تجاهل أخطاء التحليل أثناء الكتابة
                  }
                }}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                placeholder='{"fields": ["name", "surname"], "table": "person", "filters": {}}'
              />
              <div className="mt-2 text-xs text-gray-500">
                تعريف التقرير بصيغة JSON يحدد الحقول والعلاقات والفلاتر التي سيتم تضمينها في التقرير.
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة *
              </label>
              <select
                value={formData.isEnabled ? "true" : "false"}
                onChange={(e) =>
                  setFormData({ ...formData, isEnabled: e.target.value === "true" })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="true">مفعل</option>
                <option value="false">معطل</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              <Save size={18} />
              {isEdit ? "تحديث التقرير" : "إنشاء التقرير"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

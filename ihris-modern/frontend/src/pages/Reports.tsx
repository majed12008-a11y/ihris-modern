import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Play, Clock } from "lucide-react";

interface ReportDefinition {
  id: number;
  name: string;
  description: string | null;
  type: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
  executions: Array<{
    id: number;
    status: string;
    startedAt: string;
  }>;
}

interface ReportResponse {
  data: ReportDefinition[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Reports() {
  const [search, setSearch] = useState("");
  const [isEnabledFilter, setIsEnabledFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportDefinition | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ReportResponse>({
    queryKey: ["reports", search, isEnabledFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (isEnabledFilter && isEnabledFilter !== "all") params.set("isEnabled", isEnabledFilter);
      params.set("page", "1");
      params.set("limit", "50");
      const res = await api.get(`/reports?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reports/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم حذف التقرير بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل حذف التقرير");
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/reports/${id}/disable`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم إلغاء تنشيط التقرير بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إلغاء تنشيط التقرير");
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/reports/${id}/enable`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم إعادة تنشيط التقرير بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إعادة تنشيط التقرير");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("❌ Reports error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <div className="text-red-600 font-bold mb-2">⚠️ حدث خطأ في تحميل التقارير</div>
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
          <h1 className="text-2xl font-bold text-gray-800">إدارة التقارير المخصصة</h1>
          <p className="text-gray-600">إنشاء وتعديل وعرض التقارير المخصصة</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingReport(null);
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> تقرير جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="البحث باسم التقرير..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <select
                value={isEnabledFilter}
                onChange={(e) => setIsEnabledFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="all">جميع الحالات</option>
                <option value="true">مفعل فقط</option>
                <option value="false">معطل فقط</option>
              </select>
            </div>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">اسم التقرير</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">النوع</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الحالة</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">المcreatedBy</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">آخر تعديل</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.data || []).map((report: ReportDefinition) => (
              <tr key={report.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium">{report.name}</div>
                  {report.description && (
                    <div className="text-xs text-gray-500">{report.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">{report.type}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.isEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {report.isEnabled ? "مفعل" : "معطل"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {report.createdByUser.firstname} {report.createdByUser.lastname}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {new Date(report.updatedAt).toLocaleDateString("ar-SA")}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/reports/${report.id}/execute`)}
                    className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
                  >
                    <Play size={14} /> تشغيل
                  </button>
                  <button
                    onClick={() => {
                      setEditingReport(report);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Edit size={14} /> تعديل
                  </button>
                  {report.isEnabled ? (
                    <button
                      onClick={() => disableMutation.mutate(report.id)}
                      className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1"
                    >
                      <Clock size={14} /> تعطيل
                    </button>
                  ) : (
                    <button
                      onClick={() => enableMutation.mutate(report.id)}
                      className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                    >
                      <Play size={14} /> تفعيل
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
                        deleteMutation.mutate(report.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!data?.data?.length && (
        <div className="text-center py-12 text-gray-500">
          لا توجد تقارير متاحة
          <button
            onClick={() => {
              setEditingReport(null);
              setShowForm(true);
            }}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Plus size={18} /> إنشاء تقرير أول
          </button>
        </div>
      )}

      {/* نموذج إضافة/تعديل تقرير */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingReport ? "تعديل تقرير" : "إضافة تقرير جديد"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingReport(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم التقرير *
                  </label>
                  <input
                    type="text"
                    defaultValue={editingReport?.name || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع التقرير *
                  </label>
                  <select
                    defaultValue={editingReport?.type || "list"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                    defaultValue={editingReport?.description || ""}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReport(null);
                  }}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  حفظ التقرير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

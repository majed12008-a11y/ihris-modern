import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Position } from "@/types";

interface PositionResponse {
  data: Position[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Positions() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<PositionResponse>({
    queryKey: ["positions", search],
    queryFn: async () => {
      const res = await api.get(`/positions?search=${encodeURIComponent(search)}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/positions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("تم حذف الوظيفة بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل حذف الوظيفة");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل الوظائف...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("❌ Positions error:", error);
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
          <h1 className="text-2xl font-bold text-gray-800">الوظائف والشواغر</h1>
          <p className="text-gray-600">إدارة الهيكل الوظيفي والشواغر المتاحة</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="البحث باسم الوظيفة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button
            onClick={() => {
              console.log("🔘 Clicked Add Position button");
              setEditingPosition(null);
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> وظيفة جديدة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">كود الوظيفة</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">المسمى الوظيفي</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">المنشأة</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الحالة</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.data || []).map((position: Position) => (
              <tr key={position.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-sm">{position.code || "--"}</td>
                <td className="px-6 py-4 font-medium">{position.title || "--"}</td>
                <td className="px-6 py-4 text-gray-600">--</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">نشط</span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/positions/${position.id}`)}
                    className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
                  >
                    <Eye size={14} /> عرض
                  </button>
                  <button
                    onClick={() => {
                      setEditingPosition(position);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Edit size={14} /> تعديل
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("هل أنت متأكد من حذف هذه الوظيفة؟")) {
                        deleteMutation.mutate(position.id);
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
          لا توجد بيانات وظائف متاحة
          <button
            onClick={() => {
              setEditingPosition(null);
              setShowForm(true);
            }}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            إضافة وظيفة أول
          </button>
        </div>
      )}

      {/* نموذج إضافة/تعديل وظيفة */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPosition ? "تعديل وظيفة" : "إضافة وظيفة جديدة"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPosition(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              console.log("📝 Form submitted");
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كود الوظيفة
                </label>
                <input
                  type="text"
                  defaultValue={editingPosition?.code || ""}
                  placeholder="مثل: POS-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المسمى الوظيفي *
                </label>
                <input
                  type="text"
                  defaultValue={editingPosition?.title || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  defaultValue={editingPosition?.description || ""}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الراتب المقترح
                </label>
                <input
                  type="text"
                  defaultValue={editingPosition?.proposedSalary || ""}
                  placeholder="مثل: 150,000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPosition(null);
                  }}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

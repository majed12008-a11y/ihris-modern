import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

interface SalaryRow {
  id: number;
  personId: number;
  startDate: string;
  endDate: string | null;
  salary: string;
  notes: string | null;
  person: {
    id: number;
    surname: string;
    firstname: string;
  };
}

interface SalaryResponse {
  data: SalaryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Salaries() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryRow | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<SalaryResponse>({
    queryKey: ["salaries", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await api.get(`/salaries?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/salaries/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      toast.success("تم حذف الراتب بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل حذف الراتب");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل الرواتب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("❌ Salaries error:", error);
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
          <h1 className="text-2xl font-bold text-gray-800">إدارة الرواتب</h1>
          <p className="text-gray-600">تسجيل ومتابعة رواتب الموظفين</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="البحث باسم الموظف أو الراتب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button
            onClick={() => {
              console.log("🔘 Clicked Add Salary button");
              setEditingSalary(null);
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> راتب جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="البحث باسم الموظف أو الراتب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الموظف</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">تاريخ البدء</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">تاريخ الانتهاء</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">المبلغ</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">ملاحظات</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.data || []).map((row: SalaryRow) => (
              <tr key={row.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium">{row.person.surname} {row.person.firstname}</div>
                </td>
                <td className="px-6 py-4">{new Date(row.startDate).toLocaleDateString("ar-SA")}</td>
                <td className="px-6 py-4">
                  {row.endDate ? new Date(row.endDate).toLocaleDateString("ar-SA") : "غير محدد"}
                </td>
                <td className="px-6 py-4 font-mono">{row.salary}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{row.notes || "-"}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/salaries/${row.id}`)}
                    className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
                  >
                    <Eye size={14} /> عرض
                  </button>
                  <button
                    onClick={() => {
                      setEditingSalary(row);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Edit size={14} /> تعديل
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("هل أنت متأكد من حذف هذا الراتب؟")) {
                        deleteMutation.mutate(row.id);
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
          لا توجد بيانات رواتب متاحة
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            إضافة راتب أول
          </button>
        </div>
      )}

      {/* نموذج إضافة/تعديل راتب */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSalary ? "تعديل راتب" : "إضافة راتب جديد"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingSalary(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم معرف الموظف *
                </label>
                <input
                  type="text"
                  defaultValue={editingSalary?.personId?.toString() || ""}
                  placeholder="مثل: 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ البدء *
                  </label>
                  <input
                    type="date"
                    defaultValue={editingSalary?.startDate ? new Date(editingSalary.startDate).toISOString().split("T")[0] : ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    defaultValue={editingSalary?.endDate ? new Date(editingSalary.endDate).toISOString().split("T")[0] : ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المبلغ *
                </label>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">ر.ي</span>
                <input
                  type="text"
                  defaultValue={editingSalary?.salary || ""}
                  placeholder="مثل: 150,000"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  defaultValue={editingSalary?.notes || ""}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSalary(null);
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

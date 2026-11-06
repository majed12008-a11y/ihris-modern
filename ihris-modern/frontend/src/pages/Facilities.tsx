import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Building2,
} from "lucide-react";

interface FacilityRow {
  id: number;
  name: string;
  version: number;
  facilityType: { id: number; name: string } | null;
  country: { id: number; name: string } | null;
  region: { id: number; name: string } | null;
  district: { id: number; name: string } | null;
  county: { id: number; name: string } | null;
  positionsCount: number;
}

interface FacilityListResponse {
  data: FacilityRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

export default function Facilities() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<FacilityRow | null>(null);

  const { data, isLoading, error } = useQuery<FacilityListResponse>({
    queryKey: ["facilities", search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await api.get(`/facilities?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: FacilityRow) => {
      const res = await api.delete(`/facilities/${row.id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("تم حذف المنشأة بنجاح");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل حذف المنشأة");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل المنشآت...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <div className="text-red-600 font-bold mb-2">⚠️ حدث خطأ في تحميل البيانات</div>
          <p className="text-gray-600 text-sm mb-4">
            {error instanceof Error ? error.message : String(error)}
          </p>
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
          <h1 className="text-2xl font-bold text-gray-800">إدارة المنشآت الصحية</h1>
          <p className="text-gray-600">عرض وإدارة المنشآت المرتبطة بالوظائف والموظفين</p>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate("/facilities/new")}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> منشأة جديدة
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative md:w-96">
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="البحث باسم المنشأة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">المنشأة</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">النوع</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الموقع</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الوظائف</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.data || []).map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 text-primary-600 p-2 rounded-lg">
                        <Building2 size={18} />
                      </div>
                      <span className="font-medium text-gray-800">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {row.facilityType?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {[row.country?.name, row.region?.name, row.district?.name, row.county?.name]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {row.positionsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/facilities/${row.id}`)}
                        className="text-gray-600 hover:text-gray-800 p-1"
                        title="عرض"
                      >
                        <Eye size={18} />
                      </button>
                      {canWrite && (
                        <button
                          onClick={() => navigate(`/facilities/${row.id}/edit`)}
                          className="text-primary-600 hover:text-primary-800 p-1"
                          title="تعديل"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(row)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!data?.data?.length && (
          <div className="text-center py-12 text-gray-500">لا توجد منشآت مطابقة</div>
        )}

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              صفحة {data.page} من {data.totalPages} — {data.total} منشأة
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronRight size={16} /> السابق
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1"
              >
                التالي <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-2 rounded-full">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">حذف المنشأة</h2>
                <p className="text-gray-600 text-sm mt-1">
                  سيتم حذف <span className="font-bold">{deleteTarget.name}</span> نهائياً.
                  لا يمكن الحذف إذا كانت مرتبطة بوظائف.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60 transition"
              >
                {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

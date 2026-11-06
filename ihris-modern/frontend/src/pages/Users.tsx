import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserX, AlertTriangle } from "lucide-react";

interface UserRow {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  version: number;
  createdAt: string;
}

interface UserResponse {
  data: UserRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, error } = useQuery<UserResponse>({
    queryKey: ["users", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await api.get(`/users?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      const res = await api.delete(`/users/${deleteTarget.id}`, {
        data: { version: deleteTarget.version, reason },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("تم حذف المستخدم (حذف منطقي) بنجاح");
      setDeleteTarget(null);
      setReason("");
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل حذف المستخدم");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل المستخدمين...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <p className="text-gray-600">إدارة الحسابات والصلاحيات في النظام</p>
        </div>

        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate("/users/deleted")}
              className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-gray-50 transition"
            >
              <UserX size={18} /> المستخدمون المحذوفون
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => navigate("/users/new")}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
            >
              <Plus size={18} /> مستخدم جديد
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="البحث باسم المستخدم أو البريد الإلكتروني..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">اسم المستخدم</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الاسم الكامل</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">البريد الإلكتروني</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الدور</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">تاريخ الإنشاء</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.data || []).map((row: UserRow) => {
              const canEdit = isAdmin || currentUser?.id === row.id;
              const canDelete = isAdmin && currentUser?.id !== row.id;

              return (
                <tr key={row.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-sm">{row.username}</td>
                  <td className="px-6 py-4">{row.firstname} {row.lastname}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{row.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : row.role === "hr_manager"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {row.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(row.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/users/${row.id}/edit`)}
                          className="text-primary-600 hover:text-primary-800 p-1"
                          title="تعديل"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            setDeleteTarget(row);
                            setReason("");
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!data?.data?.length && (
        <div className="text-center py-12 text-gray-500">لا توجد بيانات مستخدمين متاحة</div>
      )}

      {/* Modal تأكيد الحذف مع إدخال السبب */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-2 rounded-full">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">حذف المستخدم</h2>
                <p className="text-gray-600 text-sm mt-1">
                  سيتم حذف <span className="font-mono font-bold">{deleteTarget.username}</span>{" "}
                  حذفاً منطقياً، ويمكن استعادته خلال 30 يوماً.
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              سبب الحذف *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="اكتب سبب حذف الحساب..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/500</p>

            <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending || reason.trim().length === 0}
                onClick={() => deleteMutation.mutate()}
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

import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, ShieldAlert } from "lucide-react";

interface DeletedUserRow {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  version: number;
  deletedAt: string;
  deletedBy: number | null;
  deletionReason: string | null;
  daysSinceDeletion: number;
  daysRemaining: number;
  restorable: boolean;
}

interface DeletedUserResponse {
  data: DeletedUserRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DeletedUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

  const { data, isLoading, error } = useQuery<DeletedUserResponse>({
    queryKey: ["users", "deleted"],
    queryFn: async () => {
      const res = await api.get("/users/deleted");
      return res.data;
    },
    enabled: isAdmin,
  });

  const restoreMutation = useMutation({
    mutationFn: async (row: DeletedUserRow) => {
      const res = await api.post(`/users/${row.id}/restore`, { version: row.version });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("تم استعادة المستخدم بنجاح");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "فشل استعادة المستخدم");
    },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <ShieldAlert className="mx-auto text-red-600 mb-3" size={40} />
          <h1 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h1>
          <p className="text-gray-600 text-sm">
            صفحة المستخدمين المحذوفين متاحة لمسؤول النظام فقط.
          </p>
          <button
            onClick={() => navigate("/users")}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/users")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المستخدمون المحذوفون</h1>
          <p className="text-gray-600">
            يمكن استعادة المستخدم خلال 30 يوماً من تاريخ الحذف (admin فقط).
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-10 text-gray-500">جاري التحميل...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          حدث خطأ أثناء تحميل القائمة.
        </div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">اسم المستخدم</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">الاسم</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">البريد</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">الدور</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">تاريخ الحذف</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">السبب</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">المتبقي</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.data || []).map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-4 font-mono text-sm">{row.username}</td>
                <td className="px-4 py-4">{row.firstname} {row.lastname}</td>
                <td className="px-4 py-4 text-gray-600 text-sm">{row.email}</td>
                <td className="px-4 py-4 text-sm">{row.role}</td>
                <td className="px-4 py-4 text-gray-600 text-sm">
                  {new Date(row.deletedAt).toLocaleString("ar-SA")}
                </td>
                <td className="px-4 py-4 text-gray-600 text-sm max-w-xs truncate" title={row.deletionReason || ""}>
                  {row.deletionReason || "—"}
                </td>
                <td className="px-4 py-4 text-sm">
                  {row.restorable ? (
                    <span className="text-green-700">{row.daysRemaining} يوم</span>
                  ) : (
                    <span className="text-red-600">انتهت</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    disabled={!row.restorable || restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(row)}
                    className="text-primary-600 hover:text-primary-800 flex items-center gap-1 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    title={row.restorable ? "استعادة" : "انتهت فترة الاستعادة"}
                  >
                    <RotateCcw size={16} /> استعادة
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && !data?.data?.length && (
          <div className="text-center py-12 text-gray-500">لا يوجد مستخدمون محذوفون.</div>
        )}
      </div>
    </div>
  );
}

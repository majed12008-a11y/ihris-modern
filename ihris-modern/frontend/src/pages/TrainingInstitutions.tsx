import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  AlertTriangle,
  X,
  Save,
} from "lucide-react";

/**
 * Sprint 6 / GAP-FE-009 — إدارة المؤسسات التدريبية.
 * حذف فيزيائي مع فحص المراجع (422) + قفل تفاؤلي (version) + Audit خلفي.
 */

interface Institution {
  id: number;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function TrainingInstitutions() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canWrite =
    user?.role === "admin" || user?.role === "hr_manager" || user?.role === "training_manager";

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Institution | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);

  const institutionsQuery = useQuery<Institution[]>({
    queryKey: ["training-institutions", search],
    queryFn: async () =>
      (await api.get("/training/institutions", { params: search ? { search } : {} })).data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["training-institutions"] });
  };

  const createMutation = useMutation({
    mutationFn: async () => (await api.post("/training/institutions", { name: name.trim() })).data,
    onSuccess: () => {
      invalidate();
      toast.success("تمت إضافة المؤسسة التدريبية");
      closeForm();
    },
    onError: (error) => setFormErrors(extractErrorMessages(error)),
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      (
        await api.put(`/training/institutions/${editing!.id}`, {
          name: name.trim(),
          version: editing!.version,
        })
      ).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم تحديث المؤسسة التدريبية");
      closeForm();
    },
    onError: (error) => setFormErrors(extractErrorMessages(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (institution: Institution) =>
      (await api.delete(`/training/institutions/${institution.id}`)).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم حذف المؤسسة التدريبية");
      setDeleteTarget(null);
      setDeleteErrors([]);
    },
    onError: (error) => setDeleteErrors(extractErrorMessages(error)),
  });

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setName("");
    setFormErrors([]);
  }

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setName("");
    setFormErrors([]);
  }

  function openEdit(institution: Institution) {
    setEditing(institution);
    setCreating(false);
    setName(institution.name);
    setFormErrors([]);
  }

  const institutions = institutionsQuery.data ?? [];
  const formOpen = creating || editing !== null;
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/training"
            className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
          >
            <ArrowLeft size={18} /> التدريب
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">المؤسسات التدريبية</h1>
            <p className="text-gray-600">إدارة المؤسسات التي تُنظَّم فيها الدورات</p>
          </div>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> مؤسسة جديدة
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث بالاسم..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {institutionsQuery.isLoading ? (
          <div className="text-center py-12 text-gray-500">جاري تحميل المؤسسات...</div>
        ) : institutionsQuery.error ? (
          <div className="text-center py-12 text-red-600">
            {extractErrorMessages(institutionsQuery.error).join(" — ")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">الاسم</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإصدار</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {institutions.map((institution) => (
                  <tr key={institution.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <Building2 size={16} className="text-primary-500" />
                      {institution.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">v{institution.version}</td>
                    <td className="px-6 py-4">
                      {canWrite && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(institution)}
                            className="text-primary-600 hover:text-primary-800 p-1"
                            title="تعديل"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(institution);
                              setDeleteErrors([]);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!institutionsQuery.isLoading && !institutions.length && (
          <div className="text-center py-12 text-gray-500">لا توجد مؤسسات تدريبية</div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "تعديل مؤسسة تدريبية" : "إضافة مؤسسة تدريبية"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm space-y-1">
                {formErrors.map((message, index) => (
                  <div key={index}>• {message}</div>
                ))}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setFormErrors([]);
                if (!name.trim()) {
                  setFormErrors(["اسم المؤسسة مطلوب"]);
                  return;
                }
                if (editing) updateMutation.mutate();
                else createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المؤسسة *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={255}
                  required
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-2 rounded-full">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">تأكيد الحذف</h2>
                  <button
                    onClick={() => {
                      setDeleteTarget(null);
                      setDeleteErrors([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  سيُحذف <span className="font-bold">{deleteTarget.name}</span> نهائياً. لا يمكن
                  الحذف إذا كانت هناك دورات تدريبية مرتبطة بها.
                </p>
              </div>
            </div>

            {deleteErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm space-y-1">
                {deleteErrors.map((message, index) => (
                  <div key={index}>• {message}</div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteErrors([]);
                }}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

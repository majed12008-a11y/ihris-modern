import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Briefcase,
  Save,
  X,
} from "lucide-react";

interface Ref {
  id: number;
  name: string;
}

interface JobRow {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  salaryGradeId: number | null;
  cadreId: number | null;
  classificationId: number | null;
  salaryGrade: Ref | null;
  cadre: Ref | null;
  classification: Ref | null;
  version: number;
  positionsCount: number;
}

interface JobListResponse {
  data: JobRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface JobFormData {
  title: string;
  code: string;
  description: string;
  salaryGradeId: string;
  cadreId: string;
  classificationId: string;
}

const emptyForm: JobFormData = {
  title: "",
  code: "",
  description: "",
  salaryGradeId: "",
  cadreId: "",
  classificationId: "",
};

const PAGE_SIZE = 20;

export default function Jobs() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<JobRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<JobFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<JobRow | null>(null);

  const { data, isLoading, error } = useQuery<JobListResponse>({
    queryKey: ["jobs", search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await api.get(`/jobs?${params.toString()}`);
      return res.data;
    },
  });

  // ADR-007: cascade مرجعي
  const { data: salaryGrades = [] } = useQuery<Ref[]>({
    queryKey: ["meta-salary-grades"],
    queryFn: async () => (await api.get("/jobs/meta/salary-grades")).data,
  });
  const { data: cadres = [] } = useQuery<Ref[]>({
    queryKey: ["meta-cadres"],
    queryFn: async () => (await api.get("/jobs/meta/cadres")).data,
  });
  const { data: classifications = [] } = useQuery<Ref[]>({
    queryKey: ["meta-classifications"],
    queryFn: async () => (await api.get("/jobs/meta/classifications")).data,
  });

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEdit = (row: JobRow) => {
    setEditing(row);
    setFormData({
      title: row.title,
      code: row.code ?? "",
      description: row.description ?? "",
      salaryGradeId: row.salaryGradeId ? String(row.salaryGradeId) : "",
      cadreId: row.cadreId ? String(row.cadreId) : "",
      classificationId: row.classificationId ? String(row.classificationId) : "",
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        title: formData.title,
        code: formData.code.trim() ? formData.code.trim() : null,
        description: formData.description.trim() ? formData.description.trim() : null,
        salaryGradeId: formData.salaryGradeId
          ? parseInt(formData.salaryGradeId, 10)
          : null,
        cadreId: formData.cadreId ? parseInt(formData.cadreId, 10) : null,
        classificationId: formData.classificationId
          ? parseInt(formData.classificationId, 10)
          : null,
      };
      if (editing) {
        body.version = editing.version;
        return (await api.put(`/jobs/${editing.id}`, body)).data;
      }
      return (await api.post("/jobs", body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(editing ? "تم تحديث المسمى بنجاح" : "تم إضافة المسمى بنجاح");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      setFormErrors(body?.errors || [body?.error || "فشل حفظ المسمى"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: JobRow) => {
      return (await api.delete(`/jobs/${row.id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("تم حذف المسمى بنجاح");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل حذف المسمى");
      setDeleteTarget(null);
    },
  });

  if (isLoading) {
    return <div className="p-6 text-gray-600">جاري تحميل المسميات الوظيفية...</div>;
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border border-red-100">
        <div className="text-red-600 font-bold mb-2">⚠️ حدث خطأ في تحميل البيانات</div>
        <p className="text-gray-600 text-sm">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المسميات الوظيفية</h1>
          <p className="text-gray-600">
            بيانات مرجعية — درجة الراتب والفئة والتصنيف تُدار عبر cascade
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> مسمى جديد
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative md:w-96">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث بالمسمى أو الكود..."
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
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">المسمى</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الكود</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الدرجة / الفئة / التصنيف</th>
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
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{row.title}</div>
                        {row.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {row.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm font-mono">
                    {row.code || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {[row.salaryGrade?.name, row.cadre?.name, row.classification?.name]
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
                      {canWrite && (
                        <button
                          onClick={() => openEdit(row)}
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
          <div className="text-center py-12 text-gray-500">لا توجد مسميات مطابقة</div>
        )}

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              صفحة {data.page} من {data.totalPages} — {data.total} مسمى
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

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "تعديل مسمى وظيفي" : "إضافة مسمى وظيفي"}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormErrors([]);
                if (!formData.title.trim()) {
                  setFormErrors(["المسمى الوظيفي مطلوب"]);
                  return;
                }
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المسمى الوظيفي *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    maxLength={255}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الكود (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    درجة الراتب
                  </label>
                  <select
                    value={formData.salaryGradeId}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryGradeId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">بدون</option>
                    {salaryGrades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الفئة الوظيفية
                  </label>
                  <select
                    value={formData.cadreId}
                    onChange={(e) => setFormData({ ...formData, cadreId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">بدون</option>
                    {cadres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التصنيف الوظيفي
                  </label>
                  <select
                    value={formData.classificationId}
                    onChange={(e) =>
                      setFormData({ ...formData, classificationId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">بدون</option>
                    {classifications.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف (اختياري)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    maxLength={5000}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <Save size={18} />
                  {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
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
              <div>
                <h2 className="text-xl font-bold text-gray-800">حذف المسمى الوظيفي</h2>
                <p className="text-gray-600 text-sm mt-1">
                  سيتم حذف <span className="font-bold">{deleteTarget.title}</span> نهائياً.
                  لا يمكن الحذف إذا كان مرتبطاً بوظائف شاغرة ({deleteTarget.positionsCount}).
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
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
                {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

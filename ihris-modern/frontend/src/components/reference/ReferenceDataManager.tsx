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
  Save,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * ADR-008 §8.2 (القرار 5): مكوّن CRUD عام للبيانات المرجعية الخمسة.
 * كل صفحة تمرّر إعداداتها فقط (المسار + الحقول + النصوص).
 */

export interface ReferenceField {
  key: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  mono?: boolean;
  textarea?: boolean;
}

export interface ReferenceDataManagerProps {
  entity: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  fields: ReferenceField[];
  searchPlaceholder?: string;
}

interface ReferenceRow {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  notes?: string | null;
  version: number;
  createdAt: string;
  [key: string]: unknown;
}

interface ReferenceListResponse {
  data: ReferenceRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

function buildEmptyForm(fields: ReferenceField[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
}

export default function ReferenceDataManager({
  entity,
  title,
  subtitle,
  icon: Icon,
  fields,
  searchPlaceholder = "ابحث بالاسم أو الكود...",
}: ReferenceDataManagerProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ReferenceRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    buildEmptyForm(fields)
  );
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ReferenceRow | null>(null);

  const { data, isLoading, error } = useQuery<ReferenceListResponse>({
    queryKey: ["reference", entity, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await api.get(`/reference/${entity}?${params.toString()}`);
      return res.data;
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormData(buildEmptyForm(fields));
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEdit = (row: ReferenceRow) => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = row[field.key];
      next[field.key] = value === null || value === undefined ? "" : String(value);
    }
    setEditing(row);
    setFormData(next);
    setFormErrors([]);
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = (formData[field.key] ?? "").trim();
        body[field.key] = raw === "" ? null : raw;
      }
      if (!body.name) {
        throw new Error("__NAME_REQUIRED__");
      }
      if (editing) {
        body.version = editing.version;
        return (await api.put(`/reference/${entity}/${editing.id}`, body)).data;
      }
      return (await api.post(`/reference/${entity}`, body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference", entity] });
      toast.success(editing ? "تم تحديث السجل بنجاح" : "تم إنشاء السجل بنجاح");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err: any) => {
      if (err?.message === "__NAME_REQUIRED__") {
        setFormErrors(["الاسم مطلوب"]);
        return;
      }
      const body = err.response?.data;
      setFormErrors(body?.errors || [body?.error || "تعذر تنفيذ العملية"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: ReferenceRow) => {
      return (await api.delete(`/reference/${entity}/${row.id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference", entity] });
      toast.success("تم حذف السجل بنجاح");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "تعذر حذف السجل");
      setDeleteTarget(null);
    },
  });

  if (isLoading) {
    return <div className="p-6 text-gray-600">جارٍ تحميل البيانات...</div>;
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border border-red-100">
        <div className="text-red-600 font-bold mb-2">تعذر تحميل البيانات المرجعية</div>
        <p className="text-gray-600 text-sm">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
            <Icon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> إضافة جديد
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative md:w-96">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
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
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الاسم</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الكود</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الوصف / ملاحظات</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإصدار</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.data || []).map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{row.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm font-mono">
                    {row.code || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm max-w-md truncate">
                    {row.description || row.notes || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">v{row.version}</td>
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
          <div className="text-center py-12 text-gray-500">
            لا توجد سجلات مطابقة — أضف سجلاً جديداً للبدء
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              صفحة {data.page} من {data.totalPages} — {data.total} سجل
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "تعديل السجل" : "إضافة سجل جديد"}
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
                if (!(formData.name ?? "").trim()) {
                  setFormErrors(["الاسم مطلوب"]);
                  return;
                }
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  {field.textarea ? (
                    <textarea
                      value={formData[field.key] ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      maxLength={field.maxLength ?? 2000}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.key] ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      maxLength={field.maxLength ?? 255}
                      required={field.required}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                        field.mono ? "font-mono" : ""
                      }`}
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <Save size={18} />
                  {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
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
                <h2 className="text-xl font-bold text-gray-800">تأكيد الحذف</h2>
                <p className="text-gray-600 text-sm mt-1">
                  سيتم حذف <span className="font-bold">{deleteTarget.name}</span> نهائياً.
                  لا يمكن الحذف إذا كان السجل مرتبطاً بوظيفة أو منصب.
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
                {deleteMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

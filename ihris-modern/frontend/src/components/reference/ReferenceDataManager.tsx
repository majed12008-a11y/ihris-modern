import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, Inbox, type LucideIcon } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";

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
  searchPlaceholder = "ابحث بالاسم أو الكود…",
}: ReferenceDataManagerProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const { q, page, setQ, setPage } = useListParams({ defaultLimit: PAGE_SIZE });
  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  const [editing, setEditing] = useState<ReferenceRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    buildEmptyForm(fields)
  );
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ReferenceRow | null>(null);

  const dialogTitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<ReferenceListResponse>({
    queryKey: ["reference", entity, q, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
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

  // إغلاق نافذة النموذج بـ Escape وإعادة التركيز
  useEffect(() => {
    if (!formOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setFormOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [formOpen]);

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

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="stack">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          canWrite ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus aria-hidden="true" />
              إضافة جديد
            </button>
          ) : undefined
        }
      />

      {error && (
        <ErrorState
          title="تعذر تحميل البيانات المرجعية"
          message={error instanceof Error ? error.message : String(error)}
          onRetry={() => refetch()}
        />
      )}

      <section className="card">
        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder={searchPlaceholder}
            label={`بحث في ${title}`}
          />
          {q && (
            <button
              type="button"
              className="clear-link"
              onClick={() => {
                setSearchInput("");
                setQ("");
              }}
            >
              مسح البحث
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">الاسم</th>
                <th scope="col" className="col-compact">
                  الكود
                </th>
                <th scope="col" className="col-optional">
                  الوصف / ملاحظات
                </th>
                <th scope="col" className="col-compact">
                  الإصدار
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableSkeleton rows={5} cols={5} widths={[170, 80, 220, 40, 0]} />}

              {!isLoading &&
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{row.name}</span>
                    </td>
                    <td className="mono col-compact">{row.code || "—"}</td>
                    <td className="col-optional">
                      <span
                        style={{
                          display: "block",
                          maxWidth: 420,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--text-2)",
                        }}
                        title={row.description || row.notes || undefined}
                      >
                        {row.description || row.notes || "—"}
                      </span>
                    </td>
                    <td className="mono col-compact">v{row.version}</td>
                    <td className="col-actions">
                      <div className="row-actions">
                        {canWrite && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm"
                            aria-label={`تعديل ${row.name}`}
                            title="تعديل"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil aria-hidden="true" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm danger"
                            aria-label={`حذف ${row.name}`}
                            title="حذف"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={q ? "لا توجد سجلات مطابقة" : "لا توجد سجلات بعد"}
            text={
              q
                ? `لم نجد سجلاً يطابق «${q}».`
                : "أضف أول سجل ليظهر في القوائم المنسدلة والنماذج."
            }
            action={
              canWrite && !q ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                  <Plus aria-hidden="true" />
                  إضافة جديد
                </button>
              ) : undefined
            }
          />
        )}

        {!isLoading && rows.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            onPage={setPage}
            isFetching={isFetching}
          />
        )}
      </section>

      {formOpen && (
        <div
          className="dialog-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <div
            className="dialog dialog--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            ref={panelRef}
          >
            <div className="dialog-head">
              <span className="dialog-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div>
                <h2 className="dialog-title" id={dialogTitleId}>
                  {editing ? "تعديل السجل" : "إضافة سجل جديد"}
                </h2>
                <p className="dialog-text">{editing ? editing.name : title}</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="إغلاق"
                onClick={() => setFormOpen(false)}
                style={{ marginInlineStart: "auto", flex: "none" }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setFormErrors([]);
                if (!(formData.name ?? "").trim()) {
                  setFormErrors(["الاسم مطلوب"]);
                  return;
                }
                saveMutation.mutate();
              }}
            >
              <div className="dialog-body">
                {formErrors.length > 0 && (
                  <div className="alert alert-danger" role="alert" style={{ marginBottom: 14 }}>
                    <div>
                      {formErrors.map((message, index) => (
                        <div key={index}>{message}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-stack" style={{ gap: 14 }}>
                  {fields.map((field, index) => (
                    <div className="field" key={field.key}>
                      <label className="label" htmlFor={`ref-${entity}-${field.key}`}>
                        {field.label}
                        {field.required ? <span className="req">*</span> : null}
                      </label>
                      {field.textarea ? (
                        <textarea
                          id={`ref-${entity}-${field.key}`}
                          className="textarea"
                          value={formData[field.key] ?? ""}
                          onChange={(event) =>
                            setFormData({ ...formData, [field.key]: event.target.value })
                          }
                          placeholder={field.placeholder}
                          maxLength={field.maxLength ?? 2000}
                          rows={3}
                        />
                      ) : (
                        <input
                          id={`ref-${entity}-${field.key}`}
                          ref={index === 0 ? firstFieldRef : undefined}
                          className={`input${field.mono ? " mono" : ""}`}
                          type="text"
                          value={formData[field.key] ?? ""}
                          onChange={(event) =>
                            setFormData({ ...formData, [field.key]: event.target.value })
                          }
                          placeholder={field.placeholder}
                          maxLength={field.maxLength ?? 255}
                          spellCheck={false}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="dialog-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setFormOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                  <Save aria-hidden="true" />
                  {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="حذف السجل"
        text={
          <>
            سيتم حذف <strong>{deleteTarget?.name}</strong> نهائياً. لا يمكن الحذف إذا
            كان السجل مرتبطاً بوظيفة أو منصب.
          </>
        }
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe2, Save, X, SearchX } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatNumber } from "@/lib/format";

interface CountryRow {
  id: number;
  name: string;
  code: string | null;
  version: number;
  createdAt: string;
}

interface CountryListResponse {
  data: CountryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZES = [10, 20, 50];

export default function Countries() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[1],
  });
  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  const [editing, setEditing] = useState<CountryRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CountryRow | null>(null);

  const dialogTitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // إدخال المستخدم ← عنوان URL (بعد توقّف الكتابة)
  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  // تغيّر خارجي (شريط البحث العلوي أو زر الرجوع) ← حقل البحث
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<CountryListResponse>({
    queryKey: ["countries", q, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/countries?${params.toString()}`);
      return res.data;
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: "", code: "" });
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEdit = (row: CountryRow) => {
    setEditing(row);
    setFormData({ name: row.name, code: row.code ?? "" });
    setFormErrors([]);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
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
      const body: Record<string, unknown> = {
        name: formData.name,
        code: formData.code.trim() ? formData.code.trim() : null,
      };
      if (editing) {
        body.version = editing.version;
        return (await api.put(`/countries/${editing.id}`, body)).data;
      }
      return (await api.post("/countries", body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast.success(editing ? "تم تحديث الدولة بنجاح" : "تم إضافة الدولة بنجاح");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      setFormErrors(body?.errors || [body?.error || "فشل حفظ الدولة"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: CountryRow) => {
      return (await api.delete(`/countries/${row.id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast.success("تم حذف الدولة بنجاح");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل حذف الدولة");
      setDeleteTarget(null);
    },
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const clearSearch = () => {
    setSearchInput("");
    setQ("");
  };

  return (
    <div className="stack">
      <PageHeader
        title="إدارة الدول"
        subtitle="بيانات مرجعية — يمكن حذف الدولة فقط إن لم تكن مستخدمة"
        actions={
          canWrite ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus aria-hidden="true" />
              دولة جديدة
            </button>
          ) : undefined
        }
      />

      {error && (
        <ErrorState
          message={error instanceof Error ? error.message : String(error)}
          onRetry={() => refetch()}
        />
      )}

      <section className="card">
        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="البحث بالاسم أو الكود…"
            label="بحث في الدول"
          />

          <select
            className="select"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            aria-label="عدد السجلات في الصفحة"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} في الصفحة
              </option>
            ))}
          </select>

          {(q || searchInput) && (
            <button type="button" className="clear-link" onClick={clearSearch}>
              مسح البحث
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table data-table--dense">
            <thead>
              <tr>
                <th scope="col">الدولة</th>
                <th scope="col" className="col-compact">
                  الكود
                </th>
                <th scope="col" className="col-optional">
                  الإصدار
                </th>
                <th scope="col" className="col-optional">
                  تاريخ الإنشاء
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton rows={6} cols={5} widths={[190, 60, 50, 100, 0]} />
              )}

              {!isLoading &&
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="cell-person">
                        <span className="avatar sm a1" aria-hidden="true">
                          <Globe2 size={15} />
                        </span>
                        <span className="person-meta">
                          <span className="person-name">{row.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="mono col-compact">{row.code || "—"}</td>
                    <td className="mono col-optional">v{formatNumber(row.version)}</td>
                    <td className="mono col-optional">{formatDate(row.createdAt)}</td>
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
            icon={q ? SearchX : Globe2}
            title={q ? "لا دول مطابقة" : "لا توجد دول بعد"}
            text={
              q
                ? `لم نجد دولة تطابق «${q}». جرّب جزءاً من الاسم أو الكود أو امسح البحث.`
                : "أضف أول دولة لتظهر في قوائم الجنسية والدولة والإقامة."
            }
            action={
              q ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearSearch}
                >
                  مسح البحث
                </button>
              ) : canWrite ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                  <Plus aria-hidden="true" />
                  دولة جديدة
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
            if (event.target === event.currentTarget) closeForm();
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
                <Globe2 size={18} />
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 className="dialog-title" id={dialogTitleId}>
                  {editing ? "تعديل دولة" : "إضافة دولة"}
                </h2>
                <p className="dialog-text">
                  {editing
                    ? editing.name
                    : "بيانات مرجعية تُستخدم في سجلات الموظفين والمنشآت."}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="إغلاق"
                onClick={closeForm}
                style={{ marginInlineStart: "auto", flex: "none" }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setFormErrors([]);
                if (!formData.name.trim()) {
                  setFormErrors(["اسم الدولة مطلوب"]);
                  firstFieldRef.current?.focus();
                  return;
                }
                saveMutation.mutate();
              }}
            >
              <div className="dialog-body">
                {formErrors.length > 0 && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                    style={{ marginBottom: 14 }}
                  >
                    <div>
                      {formErrors.map((message, index) => (
                        <div key={index}>{message}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-stack" style={{ gap: 14 }}>
                  <div className="field">
                    <label className="label" htmlFor="country-name">
                      اسم الدولة <span className="req">*</span>
                    </label>
                    <input
                      id="country-name"
                      ref={firstFieldRef}
                      className={`input${formErrors.length > 0 ? " is-invalid" : ""}`}
                      type="text"
                      value={formData.name}
                      onChange={(event) =>
                        setFormData({ ...formData, name: event.target.value })
                      }
                      maxLength={100}
                      required
                      aria-invalid={formErrors.length > 0 ? "true" : undefined}
                      aria-describedby={formErrors.length > 0 ? "country-name-err" : undefined}
                    />
                    {formErrors.length > 0 && (
                      <span className="err" id="country-name-err">
                        {formErrors[0]}
                      </span>
                    )}
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="country-code">
                      الكود (اختياري)
                    </label>
                    <input
                      id="country-code"
                      className="input mono"
                      type="text"
                      value={formData.code}
                      onChange={(event) =>
                        setFormData({ ...formData, code: event.target.value })
                      }
                      maxLength={10}
                      spellCheck={false}
                    />
                    <span className="hint">رمز قصير للدولة، مثل: YE أو SA.</span>
                  </div>
                </div>
              </div>

              <div className="dialog-foot">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saveMutation.isPending}
                >
                  <Save aria-hidden="true" />
                  {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الدولة"
        confirmLabel="تأكيد الحذف"
        pending={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        text={
          <>
            سيتم حذف{" "}
            <span style={{ fontWeight: 600 }}>{deleteTarget?.name}</span> نهائياً. لا
            يمكن الحذف إذا كانت مستخدمة في أشخاص أو منشآت أو محافظات أو تدريب.
          </>
        }
      />
    </div>
  );
}

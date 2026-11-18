import { useEffect, useId, useRef, useState } from "react";
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
  Save,
  X,
  SearchX,
  Layers,
  AlertCircle,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pill from "@/components/ui/Pill";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";

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

const PAGE_SIZES = [10, 20, 50];

export default function Jobs() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite =
    currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: 20,
  });
  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  const [editing, setEditing] = useState<JobRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<JobFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<JobRow | null>(null);

  const dialogTitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // إدخال المستخدم ← عنوان URL (بعد توقّف الكتابة)
  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  // تغيّر خارجي (رابط أو زر الرجوع) ← حقل البحث
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<JobListResponse>({
    queryKey: ["jobs", q, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      params.set("page", String(page));
      params.set("limit", String(limit));
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
        title="المسميات الوظيفية"
        subtitle={
          isLoading
            ? "جاري تحميل المسميات الوظيفية…"
            : `بيانات مرجعية — درجة الراتب والفئة والتصنيف تُدار عبر cascade · ${formatNumber(
                total
              )} مسمى`
        }
        actions={
          canWrite ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus aria-hidden="true" />
              مسمى جديد
            </button>
          ) : undefined
        }
      />

      {error && (
        <ErrorState
          title="تعذّر تحميل المسميات الوظيفية"
          message={error instanceof Error ? error.message : String(error)}
          onRetry={() => refetch()}
        />
      )}

      <section className="card">
        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="البحث بالمسمى أو الكود…"
            label="بحث في المسميات الوظيفية"
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
                <th scope="col">المسمى</th>
                <th scope="col" className="col-compact">
                  الكود
                </th>
                <th scope="col" className="col-optional">
                  الدرجة / الفئة / التصنيف
                </th>
                <th scope="col" className="col-compact">
                  الوظائف
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton
                  rows={6}
                  cols={5}
                  widths={[190, 70, 210, 50, 0]}
                />
              )}

              {!isLoading &&
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className="person-meta"
                        style={{ maxWidth: 420 }}
                      >
                        <span className="person-name">{row.title}</span>
                        {row.description && (
                          <span className="person-sub" title={row.description}>
                            {row.description}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="mono col-compact">{row.code || "—"}</td>
                    <td className="col-optional">
                      {[row.salaryGrade?.name, row.cadre?.name, row.classification?.name]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td className="col-compact">
                      <Pill tone={row.positionsCount > 0 ? "warn" : "mute"}>
                        {formatNumber(row.positionsCount)}
                      </Pill>
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <a
                          className="icon-btn icon-btn--sm"
                          href={`/jobs/${row.id}`}
                          aria-label={`عرض تفاصيل ${row.title}`}
                          title="عرض التفاصيل"
                          onClick={(event) => {
                            event.preventDefault();
                            navigate(`/jobs/${row.id}`);
                          }}
                        >
                          <Eye aria-hidden="true" />
                        </a>
                        {canWrite && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm"
                            aria-label={`تعديل ${row.title}`}
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
                            aria-label={`حذف ${row.title}`}
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
            icon={q ? SearchX : Layers}
            title={q ? "لا توجد مسميات مطابقة" : "لا توجد مسميات بعد"}
            text={
              q
                ? `لم نجد مسمى يطابق «${q}». جرّب جزءاً من المسمى أو امسح البحث.`
                : "أضف أول مسمى وظيفي ليظهر في الوظائف والنماذج المرتبطة."
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
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={openCreate}
                >
                  <Plus aria-hidden="true" />
                  مسمى جديد
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
                <Layers size={18} />
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 className="dialog-title" id={dialogTitleId}>
                  {editing ? "تعديل مسمى وظيفي" : "إضافة مسمى وظيفي"}
                </h2>
                <p className="dialog-text">
                  {editing
                    ? editing.title
                    : "المسمى والكود وبيانات التصنيف المرجعية"}
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
                if (!formData.title.trim()) {
                  setFormErrors(["المسمى الوظيفي مطلوب"]);
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
                    <AlertCircle aria-hidden="true" />
                    <div>
                      {formErrors.map((message, index) => (
                        <div key={index}>{message}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-body" style={{ padding: 0 }}>
                  <div className="field">
                    <label className="label" htmlFor="job-title">
                      المسمى الوظيفي <span className="req">*</span>
                    </label>
                    <input
                      ref={firstFieldRef}
                      className={`input${
                        formErrors.length > 0 && !formData.title.trim()
                          ? " is-invalid"
                          : ""
                      }`}
                      id="job-title"
                      type="text"
                      value={formData.title}
                      onChange={(event) =>
                        setFormData({ ...formData, title: event.target.value })
                      }
                      maxLength={255}
                      aria-invalid={
                        formErrors.length > 0 && !formData.title.trim()
                          ? "true"
                          : undefined
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="job-code">
                      الكود (اختياري)
                    </label>
                    <input
                      className="input mono"
                      id="job-code"
                      type="text"
                      value={formData.code}
                      onChange={(event) =>
                        setFormData({ ...formData, code: event.target.value })
                      }
                      maxLength={50}
                      spellCheck={false}
                    />
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="job-salary-grade">
                      درجة الراتب
                    </label>
                    <select
                      className="select"
                      id="job-salary-grade"
                      value={formData.salaryGradeId}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          salaryGradeId: event.target.value,
                        })
                      }
                    >
                      <option value="">بدون</option>
                      {salaryGrades.map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="job-cadre">
                      الفئة الوظيفية
                    </label>
                    <select
                      className="select"
                      id="job-cadre"
                      value={formData.cadreId}
                      onChange={(event) =>
                        setFormData({ ...formData, cadreId: event.target.value })
                      }
                    >
                      <option value="">بدون</option>
                      {cadres.map((cadre) => (
                        <option key={cadre.id} value={cadre.id}>
                          {cadre.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="job-classification">
                      التصنيف الوظيفي
                    </label>
                    <select
                      className="select"
                      id="job-classification"
                      value={formData.classificationId}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          classificationId: event.target.value,
                        })
                      }
                    >
                      <option value="">بدون</option>
                      {classifications.map((classification) => (
                        <option key={classification.id} value={classification.id}>
                          {classification.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field full">
                    <label className="label" htmlFor="job-description">
                      الوصف (اختياري)
                    </label>
                    <textarea
                      className="textarea"
                      id="job-description"
                      value={formData.description}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          description: event.target.value,
                        })
                      }
                      rows={3}
                      maxLength={5000}
                    />
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
        open={deleteTarget !== null}
        title="حذف المسمى الوظيفي"
        text={
          <>
            سيتم حذف <strong>{deleteTarget?.title}</strong> نهائياً. لا يمكن الحذف
            إذا كان مرتبطاً بوظائف شاغرة (
            {formatNumber(deleteTarget?.positionsCount ?? 0)}).
          </>
        }
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  SearchX,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatNumber } from "@/lib/format";

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

const PAGE_SIZES = [10, 25, 50];

export default function TrainingInstitutions() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canWrite =
    user?.role === "admin" || user?.role === "hr_manager" || user?.role === "training_manager";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[0],
  });
  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  const [editing, setEditing] = useState<Institution | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);

  const dialogTitleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    setDeleteTarget(null);
    setDeleteErrors([]);
  }, [q, page, limit]);

  const institutionsQuery = useQuery<Institution[]>({
    queryKey: ["training-institutions", q],
    queryFn: async () =>
      (await api.get("/training/institutions", { params: q ? { search: q } : {} })).data,
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
    setNameError(null);
    setFormErrors([]);
  }

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setName("");
    setNameError(null);
    setFormErrors([]);
  }

  function openEdit(institution: Institution) {
    setEditing(institution);
    setCreating(false);
    setName(institution.name);
    setNameError(null);
    setFormErrors([]);
  }

  // إغلاق نافذة النموذج بـ Escape وإعادة التركيز إلى العنصر السابق
  const formOpen = creating || editing !== null;
  useEffect(() => {
    if (!formOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeForm();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [formOpen]);

  const institutions = institutionsQuery.data ?? [];
  const total = institutions.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const rows = institutions.slice((currentPage - 1) * limit, currentPage * limit);
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const clearSearch = () => {
    setSearchInput("");
    setQ("");
  };

  return (
    <div className="stack">
      <PageHeader
        title="المؤسسات التدريبية"
        subtitle="إدارة المؤسسات التي تُنظَّم فيها الدورات"
        backTo="/training"
        backLabel="التدريب"
        actions={
          canWrite ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus aria-hidden="true" />
              مؤسسة جديدة
            </button>
          ) : undefined
        }
      />

      {institutionsQuery.error && (
        <ErrorState
          title="تعذّر تحميل المؤسسات"
          message={extractErrorMessages(institutionsQuery.error).join(" — ")}
          onRetry={() => institutionsQuery.refetch()}
        />
      )}

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">المؤسسات</h2>
          <span className="card-sub">{formatNumber(total)} مؤسسة</span>
        </div>

        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="ابحث بالاسم…"
            label="بحث في المؤسسات التدريبية"
          />

          <select
            className="select"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            aria-label="عدد المؤسسات في الصفحة"
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

          {q && (
            <div className="chips">
              <span className="chip">
                البحث: {q}
                <button type="button" aria-label="إزالة فلتر البحث" onClick={clearSearch}>
                  <X aria-hidden="true" />
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table data-table--dense">
            <thead>
              <tr>
                <th scope="col">الاسم</th>
                <th scope="col" className="col-optional">
                  تاريخ الإضافة
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
              {institutionsQuery.isLoading && (
                <TableSkeleton rows={6} cols={4} widths={[200, 120, 40, 0]} />
              )}

              {!institutionsQuery.isLoading &&
                rows.map((institution) => (
                  <tr key={institution.id}>
                    <td>
                      <span className="cell-person">
                        <span
                          className="kpi-icon"
                          aria-hidden="true"
                          style={{ width: 26, height: 26, flex: "0 0 26px" }}
                        >
                          <Building2 size={14} />
                        </span>
                        <span className="person-name">{institution.name}</span>
                      </span>
                    </td>
                    <td className="mono col-optional">{formatDate(institution.createdAt)}</td>
                    <td className="mono col-compact">v{institution.version}</td>
                    <td className="col-actions">
                      {canWrite && (
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm"
                            aria-label={`تعديل ${institution.name}`}
                            title="تعديل"
                            onClick={() => openEdit(institution)}
                          >
                            <Pencil aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm danger"
                            aria-label={`حذف ${institution.name}`}
                            title="حذف"
                            onClick={() => {
                              setDeleteTarget(institution);
                              setDeleteErrors([]);
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!institutionsQuery.isLoading && rows.length === 0 && (
          <EmptyState
            icon={q ? SearchX : Building2}
            title={q ? "لا نتائج مطابقة" : "لا توجد مؤسسات تدريبية"}
            text={
              q
                ? `لم نجد مؤسسة تطابق «${q}». جرّب جزءاً من الاسم أو امسح البحث.`
                : "أضف أول مؤسسة لتظهر في قائمة اختيار المؤسسة داخل نماذج الدورات."
            }
            action={
              q ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearSearch}>
                  مسح البحث
                </button>
              ) : canWrite ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                  <Plus aria-hidden="true" />
                  مؤسسة جديدة
                </button>
              ) : undefined
            }
          />
        )}

        {!institutionsQuery.isLoading && rows.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            onPage={setPage}
            isFetching={institutionsQuery.isFetching}
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
          >
            <div className="dialog-head">
              <span className="dialog-icon" aria-hidden="true">
                <Building2 size={18} />
              </span>
              <div>
                <h2 className="dialog-title" id={dialogTitleId}>
                  {editing ? "تعديل مؤسسة تدريبية" : "إضافة مؤسسة تدريبية"}
                </h2>
                <p className="dialog-text">اسم المؤسسة يظهر في نماذج الدورات التدريبية.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="إغلاق"
                onClick={closeForm}
                style={{ marginInlineStart: "auto", flex: "none" }}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setFormErrors([]);
                if (!name.trim()) {
                  setNameError("اسم المؤسسة مطلوب");
                  firstFieldRef.current?.focus();
                  return;
                }
                if (editing) updateMutation.mutate();
                else createMutation.mutate();
              }}
              noValidate
            >
              <div className="dialog-body">
                {formErrors.length > 0 && (
                  <div className="alert alert-danger" role="alert" style={{ marginBottom: 14 }}>
                    <AlertCircle aria-hidden="true" />
                    <div>
                      {formErrors.map((message, index) => (
                        <div key={index}>{message}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="label" htmlFor="institution-name">
                    اسم المؤسسة <span className="req">*</span>
                  </label>
                  <input
                    id="institution-name"
                    ref={firstFieldRef}
                    type="text"
                    className={`input${nameError ? " is-invalid" : ""}`}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (nameError) setNameError(null);
                    }}
                    maxLength={255}
                    aria-invalid={nameError ? "true" : undefined}
                    aria-describedby={nameError ? "institution-name-err" : undefined}
                    required
                  />
                  {nameError && (
                    <p className="err" id="institution-name-err">
                      <AlertCircle aria-hidden="true" />
                      {nameError}
                    </p>
                  )}
                </div>
              </div>

              <div className="dialog-foot">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save aria-hidden="true" />
                  {saving ? "جارٍ الحفظ…" : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="تأكيد الحذف"
        text={
          <>
            سيُحذف <strong>{deleteTarget?.name}</strong> نهائياً. لا يمكن الحذف إذا كانت هناك دورات
            تدريبية مرتبطة بها.
            {deleteErrors.length > 0 && (
              <span className="alert alert-danger" role="alert" style={{ marginTop: 10 }}>
                <AlertTriangle aria-hidden="true" />
                <span>
                  {deleteErrors.map((message, index) => (
                    <span key={index} style={{ display: "block" }}>
                      {message}
                    </span>
                  ))}
                </span>
              </span>
            )}
          </>
        }
        confirmLabel="تأكيد الحذف"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteErrors([]);
        }}
      />
    </div>
  );
}

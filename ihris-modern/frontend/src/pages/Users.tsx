import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  UserX,
  Power,
  PowerOff,
  SearchX,
  Users as UsersIcon,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import Pill from "@/components/ui/Pill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { avatarTone, formatDate, formatNumber, initials } from "@/lib/format";

interface UserRow {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

interface UserResponse {
  data: UserRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type StatusFilter = "all" | "active" | "inactive";

const tabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: "النشطون" },
  { key: "inactive", label: "المعطّلون" },
];

const PAGE_SIZES = [10, 20, 50];

export default function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[1],
  });

  // فلتر الحالة محفوظ في عنوان URL أيضاً (status)
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const statusFilter: StatusFilter =
    statusParam === "active" || statusParam === "inactive" ? statusParam : "all";

  const setStatusFilter = (next: StatusFilter) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") params.delete("status");
        else params.set("status", next);
        params.delete("page");
        return params;
      },
      { replace: true }
    );
  };

  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [activateTarget, setActivateTarget] = useState<UserRow | null>(null);

  // إدخال المستخدم ← عنوان URL (بعد توقّف الكتابة)
  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  // تغيّر خارجي (شريط البحث العلوي أو زر الرجوع) ← حقل البحث
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<UserResponse>({
    queryKey: ["users", q, statusFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
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
      setReasonError("");
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل حذف المستخدم");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!deactivateTarget) return;
      const res = await api.put(`/users/${deactivateTarget.id}/deactivate`, {
        version: deactivateTarget.version,
        reason: deactivateReason.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("تم تعطيل الحساب — لن يستطيع تسجيل الدخول");
      setDeactivateTarget(null);
      setDeactivateReason("");
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل تعطيل الحساب");
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (row: UserRow) => {
      const res = await api.put(`/users/${row.id}/activate`, {
        version: row.version,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("تم إعادة تفعيل الحساب");
      setActivateTarget(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل تفعيل الحساب");
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

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (!reason.trim()) {
      setReasonError("سبب الحذف مطلوب");
      document.getElementById("user-delete-reason")?.focus();
      return;
    }
    setReasonError("");
    deleteMutation.mutate();
  };

  const hasFilter = Boolean(q || statusFilter !== "all");

  return (
    <div className="stack">
      <PageHeader
        title="إدارة المستخدمين"
        subtitle={
          isLoading
            ? "جاري تحميل المستخدمين…"
            : `${formatNumber(total)} حساب مستخدم في النظام`
        }
        actions={
          <>
            {isAdmin && (
              <a
                className="btn btn-ghost"
                href="/users/deleted"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/users/deleted");
                }}
              >
                <UserX aria-hidden="true" />
                المستخدمون المحذوفون
              </a>
            )}
            {isAdmin && (
              <a
                className="btn btn-primary"
                href="/users/new"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/users/new");
                }}
              >
                <Plus aria-hidden="true" />
                مستخدم جديد
              </a>
            )}
          </>
        }
      />

      {error && (
        <ErrorState
          message={error instanceof Error ? error.message : String(error)}
          onRetry={() => refetch()}
        />
      )}

      <section className="card">
        <div className="tabs" role="tablist" aria-label="تصفية المستخدمين بالحالة">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              className={`tab${statusFilter === tab.key ? " is-active" : ""}`}
              aria-selected={statusFilter === tab.key}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="البحث باسم المستخدم أو البريد الإلكتروني…"
            label="بحث في المستخدمين"
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
                <th scope="col">المستخدم</th>
                <th scope="col" className="col-optional">
                  البريد الإلكتروني
                </th>
                <th scope="col">الدور</th>
                <th scope="col">الحالة</th>
                <th scope="col" className="col-compact">
                  تاريخ الإنشاء
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton rows={6} cols={6} widths={[190, 150, 70, 60, 90, 0]} />
              )}

              {!isLoading &&
                rows.map((row) => {
                  const canEdit = isAdmin || currentUser?.id === row.id;
                  const canDelete = isAdmin && currentUser?.id !== row.id && row.isActive;
                  const canDeactivate =
                    isAdmin && currentUser?.id !== row.id && row.isActive;
                  const canActivate = isAdmin && !row.isActive;

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="cell-person">
                          <span
                            className={`avatar sm ${avatarTone(row.id)}`}
                            aria-hidden="true"
                          >
                            {initials(row.firstname, row.lastname)}
                          </span>
                          <span className="person-meta">
                            <span className="person-name">
                              {row.firstname} {row.lastname}
                            </span>
                            <span className="person-sub">{row.username}</span>
                          </span>
                        </div>
                      </td>
                      <td className="col-optional">{row.email}</td>
                      <td>
                        <Pill
                          tone={
                            row.role === "admin"
                              ? "danger"
                              : row.role === "hr_manager"
                                ? "warn"
                                : "mute"
                          }
                        >
                          {row.role}
                        </Pill>
                      </td>
                      <td>
                        <Pill tone={row.isActive ? "ok" : "warn"}>
                          {row.isActive ? "نشط" : "معطّل"}
                        </Pill>
                      </td>
                      <td className="mono col-compact">{formatDate(row.createdAt)}</td>
                      <td className="col-actions">
                        <div className="row-actions">
                          {canEdit && (
                            <a
                              className="icon-btn icon-btn--sm"
                              href={`/users/${row.id}/edit`}
                              aria-label={`تعديل ${row.username}`}
                              title="تعديل"
                              onClick={(event) => {
                                event.preventDefault();
                                navigate(`/users/${row.id}/edit`);
                              }}
                            >
                              <Pencil aria-hidden="true" />
                            </a>
                          )}
                          {canDeactivate && (
                            <button
                              type="button"
                              className="icon-btn icon-btn--sm"
                              aria-label={`تعطيل ${row.username}`}
                              title="تعطيل"
                              onClick={() => {
                                setDeactivateTarget(row);
                                setDeactivateReason("");
                              }}
                            >
                              <PowerOff aria-hidden="true" />
                            </button>
                          )}
                          {canActivate && (
                            <button
                              type="button"
                              className="icon-btn icon-btn--sm"
                              aria-label={`تفعيل ${row.username}`}
                              title="تفعيل"
                              disabled={activateMutation.isPending}
                              onClick={() => setActivateTarget(row)}
                            >
                              <Power aria-hidden="true" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="icon-btn icon-btn--sm danger"
                              aria-label={`حذف ${row.username}`}
                              title="حذف"
                              onClick={() => {
                                setDeleteTarget(row);
                                setReason("");
                                setReasonError("");
                              }}
                            >
                              <Trash2 aria-hidden="true" />
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

        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={hasFilter ? SearchX : UsersIcon}
            title={q ? "لا نتائج مطابقة" : hasFilter ? "لا حسابات بهذه الحالة" : "لا يوجد مستخدمون بعد"}
            text={
              q
                ? `لم نجد حساباً يطابق «${q}». جرّب جزءاً من اسم المستخدم أو البريد الإلكتروني.`
                : hasFilter
                  ? "غيّر فلتر الحالة أو امسحه لعرض كل الحسابات."
                  : "ابدأ بإنشاء أول حساب مستخدم ليظهر في هذه القائمة."
            }
            action={
              hasFilter ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    clearSearch();
                    setStatusFilter("all");
                  }}
                >
                  مسح الفلاتر
                </button>
              ) : isAdmin ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/users/new")}
                >
                  <Plus aria-hidden="true" />
                  مستخدم جديد
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

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="تعطيل الحساب"
        tone="primary"
        icon={PowerOff}
        confirmLabel="تأكيد التعطيل"
        pending={deactivateMutation.isPending}
        onClose={() => {
          setDeactivateTarget(null);
          setDeactivateReason("");
        }}
        onConfirm={() => deactivateMutation.mutate()}
        text={
          <>
            <span style={{ display: "block" }}>
              سيتم تعطيل{" "}
              <span className="mono" style={{ fontWeight: 600 }}>
                {deactivateTarget?.username}
              </span>{" "}
              ومنع تسجيل الدخول، مع الاحتفاظ بكل سجلاته وإمكانية إعادة التفعيل.
            </span>
            <label
              className="label"
              htmlFor="user-deactivate-reason"
              style={{ display: "block", marginTop: 12 }}
            >
              سبب التعطيل (اختياري)
            </label>
            <textarea
              id="user-deactivate-reason"
              className="textarea"
              value={deactivateReason}
              onChange={(event) => setDeactivateReason(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="اكتب سبب تعطيل الحساب…"
              style={{ marginTop: 6 }}
            />
            <span className="hint">{deactivateReason.length}/500</span>
          </>
        }
      />

      <ConfirmDialog
        open={Boolean(activateTarget)}
        title="إعادة تفعيل الحساب"
        tone="primary"
        icon={Power}
        confirmLabel="تفعيل الحساب"
        pending={activateMutation.isPending}
        onClose={() => setActivateTarget(null)}
        onConfirm={() => {
          if (activateTarget) activateMutation.mutate(activateTarget);
        }}
        text={
          <>
            سيتم إعادة تفعيل حساب{" "}
            <span className="mono" style={{ fontWeight: 600 }}>
              {activateTarget?.username}
            </span>{" "}
            والسماح له بتسجيل الدخول مجدداً.
          </>
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف المستخدم"
        confirmLabel="تأكيد الحذف"
        pending={deleteMutation.isPending}
        onClose={() => {
          setDeleteTarget(null);
          setReason("");
          setReasonError("");
        }}
        onConfirm={confirmDelete}
        text={
          <>
            <span style={{ display: "block" }}>
              سيتم حذف{" "}
              <span className="mono" style={{ fontWeight: 600 }}>
                {deleteTarget?.username}
              </span>{" "}
              حذفاً منطقياً، ويمكن استعادته خلال 30 يوماً.
            </span>
            <label
              className="label"
              htmlFor="user-delete-reason"
              style={{ display: "block", marginTop: 12 }}
            >
              سبب الحذف <span className="req">*</span>
            </label>
            <textarea
              id="user-delete-reason"
              className={`textarea${reasonError ? " is-invalid" : ""}`}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError("");
              }}
              rows={3}
              maxLength={500}
              placeholder="اكتب سبب حذف الحساب…"
              aria-invalid={reasonError ? "true" : undefined}
              aria-describedby={reasonError ? "user-delete-reason-err" : undefined}
              style={{ marginTop: 6 }}
            />
            <span className="hint">{reason.length}/500</span>
            {reasonError && (
              <span className="err" id="user-delete-reason-err" role="alert">
                <AlertCircle aria-hidden="true" />
                {reasonError}
              </span>
            )}
          </>
        }
      />
    </div>
  );
}

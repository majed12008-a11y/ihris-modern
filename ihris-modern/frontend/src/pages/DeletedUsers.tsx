import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { RotateCcw, ShieldAlert, SearchX, UserX } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import Pill from "@/components/ui/Pill";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { avatarTone, formatNumber, initials } from "@/lib/format";

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

const PAGE_SIZES = [10, 20, 50];

export default function DeletedUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[1],
  });
  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<DeletedUserResponse>({
    queryKey: ["users", "deleted", q, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/users/deleted?${params.toString()}`);
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
      <div className="stack">
        <PageHeader
          title="المستخدمون المحذوفون"
          subtitle="استعادة الحسابات المحذوفة منطقياً خلال 30 يوماً."
          backTo="/users"
          backLabel="رجوع"
        />
        <div className="alert alert-danger" role="alert">
          <ShieldAlert aria-hidden="true" />
          <div>
            <strong>غير مصرح.</strong> صفحة المستخدمين المحذوفين متاحة لمسؤول النظام
            فقط.
            <div style={{ marginTop: 8 }}>
              <a
                className="btn btn-ghost btn-sm"
                href="/users"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/users");
                }}
              >
                العودة
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        title="المستخدمون المحذوفون"
        subtitle={
          isLoading
            ? "جاري تحميل القائمة…"
            : `يمكن استعادة المستخدم خلال 30 يوماً من تاريخ الحذف (admin فقط) — ${formatNumber(total)} حساب`
        }
        backTo="/users"
        backLabel="رجوع"
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
            placeholder="البحث باسم المستخدم أو الاسم أو البريد…"
            label="بحث في المستخدمين المحذوفين"
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
                <th scope="col" className="col-compact">
                  تاريخ الحذف
                </th>
                <th scope="col" className="col-optional">
                  السبب
                </th>
                <th scope="col">المتبقي</th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton rows={5} cols={7} widths={[180, 140, 70, 100, 120, 60, 0]} />
              )}

              {!isLoading &&
                rows.map((row) => (
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
                    <td className="mono col-compact">
                      {new Date(row.deletedAt).toLocaleString("ar-SA")}
                    </td>
                    <td className="col-optional">
                      <span
                        style={{
                          display: "inline-block",
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "bottom",
                        }}
                        title={row.deletionReason || ""}
                      >
                        {row.deletionReason || "—"}
                      </span>
                    </td>
                    <td>
                      {row.restorable ? (
                        <Pill tone="ok">{formatNumber(row.daysRemaining)} يوم</Pill>
                      ) : (
                        <Pill tone="danger">انتهت</Pill>
                      )}
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={!row.restorable || restoreMutation.isPending}
                          onClick={() => restoreMutation.mutate(row)}
                          aria-label={`استعادة ${row.username}`}
                          title={row.restorable ? "استعادة" : "انتهت فترة الاستعادة"}
                        >
                          <RotateCcw aria-hidden="true" />
                          استعادة
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={q ? SearchX : UserX}
            title={q ? "لا نتائج مطابقة" : "لا يوجد مستخدمون محذوفون"}
            text={
              q
                ? `لم نجد حساباً محذوفاً يطابق «${q}». جرّب جزءاً من الاسم أو امسح البحث.`
                : "كل الحسابات المحذوفة منطقياً ستظهر هنا خلال 30 يوماً من الحذف."
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
    </div>
  );
}

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, SearchX, Wallet, X } from "lucide-react";
import { avatarTone, formatDate, formatNumber, initials } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";

interface SalaryRow {
  id: number;
  personId: number;
  startDate: string;
  endDate: string | null;
  salary: string;
  notes: string | null;
  person: {
    id: number;
    surname: string;
    firstname: string;
  };
}

interface SalaryResponse {
  data: SalaryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZES = [10, 25, 50];

/** المبلغ يصل كنص من الـAPI — نعرضه منسّقاً إن كان رقماً. */
function amountLabel(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatNumber(parsed) : value;
}

export default function Salaries() {
  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[0],
  });

  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);
  const [deleteTarget, setDeleteTarget] = useState<SalaryRow | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite =
    currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  // إدخال المستخدم ← عنوان URL (بعد توقّف الكتابة)
  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  // تغيّر خارجي (رابط أو زر الرجوع) ← حقل البحث
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // إغلاق أي تأكيد معلّق عند تغيّر النتائج
  useEffect(() => {
    setDeleteTarget(null);
  }, [q, page, limit]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<SalaryResponse>({
    queryKey: ["salaries", q, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/salaries?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/salaries/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      setDeleteTarget(null);
      toast.success("تم حذف الراتب بنجاح");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "فشل حذف الراتب");
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
        title="إدارة الرواتب"
        subtitle={
          isLoading
            ? "جاري تحميل السجلات…"
            : `تسجيل ومتابعة رواتب الموظفين — ${formatNumber(total)} سجل`
        }
        actions={
          canWrite ? (
            <a
              className="btn btn-primary"
              href="/salaries/new"
              onClick={(event) => {
                event.preventDefault();
                navigate("/salaries/new");
              }}
            >
              <Plus aria-hidden="true" />
              راتب جديد
            </a>
          ) : undefined
        }
      />

      {error && (
        <ErrorState
          title="تعذّر تحميل الرواتب"
          message={error instanceof Error ? error.message : String(error)}
          onRetry={() => refetch()}
        />
      )}

      <section className="card">
        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="البحث باسم الموظف أو الراتب…"
            label="بحث في الرواتب"
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

          {q && (
            <div className="chips">
              <span className="chip">
                البحث: {q}
                <button
                  type="button"
                  aria-label="إزالة فلتر البحث"
                  onClick={clearSearch}
                >
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
                <th scope="col">الموظف</th>
                <th scope="col">تاريخ البدء</th>
                <th scope="col" className="col-optional">
                  تاريخ الانتهاء
                </th>
                <th scope="col" style={{ textAlign: "end" }}>
                  المبلغ
                </th>
                <th scope="col" className="col-optional">
                  ملاحظات
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
                  cols={6}
                  widths={[180, 90, 90, 80, 160, 0]}
                />
              )}

              {!isLoading &&
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="cell-person">
                        <span
                          className={`avatar sm ${avatarTone(row.person.id)}`}
                          aria-hidden="true"
                        >
                          {initials(row.person.firstname, row.person.surname)}
                        </span>
                        <span className="person-meta">
                          <span className="person-name">
                            {row.person.surname} {row.person.firstname}
                          </span>
                          <span className="person-sub">
                            سجل راتب #{formatNumber(row.id)}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="mono">{formatDate(row.startDate)}</td>
                    <td className="mono col-optional">
                      {row.endDate ? formatDate(row.endDate) : "غير محدد"}
                    </td>
                    <td className="num" style={{ textAlign: "end" }}>
                      {amountLabel(row.salary)}
                    </td>
                    <td className="col-optional">
                      <span
                        style={{
                          display: "block",
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={row.notes ?? undefined}
                      >
                        {row.notes || "—"}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        {canWrite && (
                          <a
                            className="icon-btn icon-btn--sm"
                            href={`/salaries/${row.id}/edit`}
                            aria-label={`تعديل راتب ${row.person.surname} ${row.person.firstname}`}
                            title="تعديل"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/salaries/${row.id}/edit`);
                            }}
                          >
                            <Pencil aria-hidden="true" />
                          </a>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm danger"
                            aria-label={`حذف راتب ${row.person.surname} ${row.person.firstname}`}
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
            icon={q ? SearchX : Wallet}
            title={q ? "لا نتائج مطابقة" : "لا توجد بيانات رواتب متاحة"}
            text={
              q
                ? `لم نجد راتباً يطابق «${q}». جرّب جزءاً من اسم الموظف أو امسح البحث.`
                : "سجّل أول راتب ليظهر في القائمة وتقارير الموظفين."
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
                  onClick={() => navigate("/salaries/new")}
                >
                  <Plus aria-hidden="true" />
                  إضافة راتب أول
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
        open={deleteTarget !== null}
        title="حذف الراتب"
        text={
          <>
            سيتم حذف راتب{" "}
            <strong>
              {deleteTarget?.person.surname} {deleteTarget?.person.firstname}
            </strong>{" "}
            نهائياً. لا يمكن التراجع عن هذا الإجراء.
          </>
        }
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

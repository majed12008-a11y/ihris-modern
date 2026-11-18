import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Briefcase, Pencil, Plus, SearchX, Trash2, X } from "lucide-react";
import { Position } from "@/types";
import { formatNumber } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pill from "@/components/ui/Pill";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";

interface PositionResponse {
  data: Position[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZES = [10, 20, 50];

export default function Positions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: 20,
  });

  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);
  const search = q;

  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);

  // إدخال المستخدم ← عنوان URL (بعد توقّف الكتابة)
  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  // تغيّر خارجي (زر الرجوع أو شريط البحث العلوي) ← حقل البحث
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // إعادة ضبط التأكيد عند تغيّر النتائج
  useEffect(() => {
    setDeleteTarget(null);
  }, [search, page, limit]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<PositionResponse>({
    queryKey: ["positions", search, page, limit],
    queryFn: async () => {
      const res = await api.get("/positions", {
        params: { search, page, limit },
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/positions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("تم حذف الوظيفة بنجاح");
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل حذف الوظيفة");
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
    <>
      <PageHeader
        title="الوظائف والشواغر"
        subtitle={
          isLoading
            ? "جاري تحميل الوظائف…"
            : `${formatNumber(total)} وظيفة — إدارة الهيكل الوظيفي والشواغر المتاحة`
        }
        actions={
          <a
            className="btn btn-primary"
            href="/positions/new"
            onClick={(event) => {
              event.preventDefault();
              navigate("/positions/new");
            }}
          >
            <Plus aria-hidden="true" />
            وظيفة جديدة
          </a>
        }
      />

      {error && (
        <div style={{ marginBottom: 18 }}>
          <ErrorState
            message={error instanceof Error ? error.message : String(error)}
            onRetry={() => refetch()}
          />
        </div>
      )}

      <section className="card">
        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="البحث باسم الوظيفة…"
            label="بحث في الوظائف"
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

          {(search || searchInput) && (
            <button type="button" className="clear-link" onClick={clearSearch}>
              مسح البحث
            </button>
          )}

          {search && (
            <div className="chips">
              <span className="chip">
                البحث: {search}
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
                <th scope="col" className="col-compact">
                  كود الوظيفة
                </th>
                <th scope="col">المسمى الوظيفي</th>
                <th scope="col" className="col-optional">
                  المنشأة
                </th>
                <th scope="col">الحالة</th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton rows={6} cols={5} widths={[80, 200, 120, 60, 0]} />
              )}

              {!isLoading &&
                rows.map((position) => (
                  <tr key={position.id}>
                    <td className="mono col-compact">{position.code || "—"}</td>
                    <td>
                      <span className="person-name">{position.title || "—"}</span>
                    </td>
                    <td className="col-optional">—</td>
                    <td>
                      <Pill tone="ok">نشط</Pill>
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <a
                          className="icon-btn icon-btn--sm"
                          href={`/positions/${position.id}/edit`}
                          aria-label={`تعديل ${position.title || `الوظيفة ${position.id}`}`}
                          title="تعديل"
                          onClick={(event) => {
                            event.preventDefault();
                            navigate(`/positions/${position.id}/edit`);
                          }}
                        >
                          <Pencil aria-hidden="true" />
                        </a>
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm danger"
                          aria-label={`حذف ${position.title || `الوظيفة ${position.id}`}`}
                          title="حذف"
                          onClick={() => setDeleteTarget(position)}
                        >
                          <Trash2 aria-hidden="true" />
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
            icon={search ? SearchX : Briefcase}
            title={search ? "لا نتائج مطابقة" : "لا توجد وظائف بعد"}
            text={
              search
                ? `لم نجد وظيفة تطابق «${search}». جرّب جزءاً من المسمّى أو امسح البحث.`
                : "ابدأ بإضافة أول وظيفة لتظهر في الهيكل الوظيفي والشواغر."
            }
            action={
              search ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearSearch}
                >
                  مسح البحث
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/positions/new")}
                >
                  <Plus aria-hidden="true" />
                  وظيفة جديدة
                </button>
              )
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
        open={!!deleteTarget}
        title="حذف الوظيفة"
        text={
          deleteTarget ? (
            <>
              هل أنت متأكد من حذف هذه الوظيفة؟ سيتم حذف{" "}
              <strong>{deleteTarget.title || `الوظيفة ${deleteTarget.id}`}</strong>{" "}
              نهائياً.
            </>
          ) : undefined
        }
        confirmLabel="تأكيد الحذف"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

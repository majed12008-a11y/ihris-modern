import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Building2, Eye, Pencil, Plus, SearchX, Trash2, X } from "lucide-react";
import { formatNumber } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pill from "@/components/ui/Pill";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";

interface FacilityRow {
  id: number;
  name: string;
  version: number;
  facilityType: { id: number; name: string } | null;
  country: { id: number; name: string } | null;
  region: { id: number; name: string } | null;
  district: { id: number; name: string } | null;
  county: { id: number; name: string } | null;
  positionsCount: number;
}

interface FacilityListResponse {
  data: FacilityRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZES = [10, 20, 50];

export default function Facilities() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: 20,
  });

  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);
  const search = q;

  const [deleteTarget, setDeleteTarget] = useState<FacilityRow | null>(null);

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

  const { data, isLoading, isFetching, error, refetch } = useQuery<FacilityListResponse>({
    queryKey: ["facilities", search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await api.get(`/facilities?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: FacilityRow) => {
      const res = await api.delete(`/facilities/${row.id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("تم حذف المنشأة بنجاح");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const body = err.response?.data;
      toast.error(body?.error || "فشل حذف المنشأة");
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
        title="إدارة المنشآت الصحية"
        subtitle={
          isLoading
            ? "جاري تحميل المنشآت…"
            : `${formatNumber(total)} منشأة مسجّلة — عرض وإدارة المنشآت المرتبطة بالوظائف والموظفين`
        }
        actions={
          canWrite ? (
            <a
              className="btn btn-primary"
              href="/facilities/new"
              onClick={(event) => {
                event.preventDefault();
                navigate("/facilities/new");
              }}
            >
              <Plus aria-hidden="true" />
              منشأة جديدة
            </a>
          ) : null
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
            placeholder="البحث باسم المنشأة…"
            label="بحث في المنشآت"
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
                <th scope="col">المنشأة</th>
                <th scope="col" className="col-optional">
                  النوع
                </th>
                <th scope="col" className="col-optional">
                  الموقع
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
                <TableSkeleton rows={6} cols={5} widths={[200, 90, 150, 50, 0]} />
              )}

              {!isLoading &&
                rows.map((row) => {
                  const location =
                    [
                      row.country?.name,
                      row.region?.name,
                      row.district?.name,
                      row.county?.name,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "—";

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="cell-person">
                          <span className="avatar sm a1" aria-hidden="true">
                            <Building2 size={15} />
                          </span>
                          <span className="person-meta">
                            <span className="person-name">{row.name}</span>
                            <span className="person-sub">
                              منشأة رقم {row.id}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="col-optional">{row.facilityType?.name || "—"}</td>
                      <td className="col-optional">{location}</td>
                      <td className="col-compact">
                        <Pill tone={row.positionsCount > 0 ? "ok" : "mute"}>
                          {formatNumber(row.positionsCount)}
                        </Pill>
                      </td>
                      <td className="col-actions">
                        <div className="row-actions">
                          <a
                            className="icon-btn icon-btn--sm"
                            href={`/facilities/${row.id}`}
                            aria-label={`عرض ${row.name}`}
                            title="عرض"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/facilities/${row.id}`);
                            }}
                          >
                            <Eye aria-hidden="true" />
                          </a>
                          {canWrite && (
                            <a
                              className="icon-btn icon-btn--sm"
                              href={`/facilities/${row.id}/edit`}
                              aria-label={`تعديل ${row.name}`}
                              title="تعديل"
                              onClick={(event) => {
                                event.preventDefault();
                                navigate(`/facilities/${row.id}/edit`);
                              }}
                            >
                              <Pencil aria-hidden="true" />
                            </a>
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
                  );
                })}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={search ? SearchX : Building2}
            title={search ? "لا نتائج مطابقة" : "لا توجد منشآت بعد"}
            text={
              search
                ? `لم نجد منشأة تطابق «${search}». جرّب جزءاً من الاسم أو امسح البحث.`
                : "ابدأ بإضافة أول منشأة صحية لربط الوظائف والموظفين بها."
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
              ) : canWrite ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/facilities/new")}
                >
                  <Plus aria-hidden="true" />
                  منشأة جديدة
                </button>
              ) : null
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
        title="حذف المنشأة"
        text={
          deleteTarget ? (
            <>
              سيتم حذف <strong>{deleteTarget.name}</strong> نهائياً. لا يمكن الحذف إذا
              كانت مرتبطة بوظائف.
            </>
          ) : undefined
        }
        confirmLabel="تأكيد الحذف"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

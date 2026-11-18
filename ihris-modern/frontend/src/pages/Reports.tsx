import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Eye,
  Power,
  PowerOff,
  FileText,
  SearchX,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import Pill from "@/components/ui/Pill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatNumber } from "@/lib/format";

interface ReportDefinition {
  id: number;
  name: string;
  description: string | null;
  type: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
  /** يوفّرها الخادم في قائمة التقارير. */
  _count?: { executions: number };
  executions?: Array<{
    id: number;
    status: string;
    startedAt: string;
  }>;
}

interface ReportResponse {
  data: ReportDefinition[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZES = [10, 25, 50];

const TYPE_LABELS: Record<string, string> = {
  list: "قائمة",
  table: "جدول",
  pie: "رسم بياني دائري",
  bar: "رسم بياني شريطي",
  line: "رسم بياني خطي",
};

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type;
}

export default function Reports() {
  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[0],
  });
  const [params, setParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  // فلتر الحالة محفوظ في عنوان URL أيضاً حتى يصمد مع التحديث وزر الرجوع.
  const isEnabledFilter = params.get("enabled") ?? "all";
  const setEnabledFilter = (value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === "all") next.delete("enabled");
        else next.set("enabled", value);
        return next;
      },
      { replace: true }
    );
  };

  const [deleteTarget, setDeleteTarget] = useState<ReportDefinition | null>(
    null
  );

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // إدخال المستخدم ← عنوان URL (بعد توقّف الكتابة)
  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  // تغيّر خارجي (زر الرجوع) ← حقل البحث
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<ReportResponse>({
      queryKey: ["reports", q, isEnabledFilter, page, limit],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (q) searchParams.set("search", q);
        if (isEnabledFilter && isEnabledFilter !== "all") {
          searchParams.set("isEnabled", isEnabledFilter);
        }
        searchParams.set("page", String(page));
        searchParams.set("limit", String(limit));
        const res = await api.get(`/reports?${searchParams.toString()}`);
        return res.data;
      },
    });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reports/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setDeleteTarget(null);
      toast.success("تم حذف التقرير بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل حذف التقرير");
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/reports/${id}/disable`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم إلغاء تنشيط التقرير بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إلغاء تنشيط التقرير");
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/reports/${id}/enable`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم إعادة تنشيط التقرير بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إعادة تنشيط التقرير");
    },
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const hasFilter = Boolean(q) || isEnabledFilter !== "all";
  const toggling = disableMutation.isPending || enableMutation.isPending;

  const clearFilters = () => {
    setSearchInput("");
    setQ("");
    setEnabledFilter("all");
  };

  return (
    <>
      <PageHeader
        title="إدارة التقارير المخصصة"
        subtitle={
          isLoading
            ? "جاري تحميل التقارير…"
            : `${formatNumber(total)} تقرير مخصص`
        }
        actions={
          <a
            className="btn btn-primary"
            href="/reports/new"
            onClick={(event) => {
              event.preventDefault();
              navigate("/reports/new");
            }}
          >
            <Plus aria-hidden="true" />
            تقرير جديد
          </a>
        }
      />

      {error && (
        <div style={{ marginBottom: 18 }}>
          <ErrorState
            title="حدث خطأ في تحميل التقارير"
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
            placeholder="البحث باسم التقرير…"
            label="بحث في التقارير"
          />

          <select
            className="select"
            value={isEnabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value)}
            aria-label="تصفية حسب الحالة"
          >
            <option value="all">جميع الحالات</option>
            <option value="true">مفعل فقط</option>
            <option value="false">معطل فقط</option>
          </select>

          <select
            className="select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="عدد السجلات في الصفحة"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} في الصفحة
              </option>
            ))}
          </select>

          {(q || searchInput || isEnabledFilter !== "all") && (
            <button type="button" className="clear-link" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table data-table--dense">
            <thead>
              <tr>
                <th scope="col">اسم التقرير</th>
                <th scope="col" className="col-optional">
                  النوع
                </th>
                <th scope="col">الحالة</th>
                <th scope="col" className="col-optional">
                  المنشئ
                </th>
                <th scope="col" className="col-compact">
                  التنفيذات
                </th>
                <th scope="col" className="col-compact">
                  آخر تعديل
                </th>
                <th scope="col" className="col-actions">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton
                  rows={6}
                  cols={7}
                  widths={[160, 60, 60, 110, 50, 90, 0]}
                />
              )}

              {!isLoading &&
                rows.map((report) => {
                  const executions =
                    report._count?.executions ?? report.executions?.length;
                  return (
                    <tr key={report.id}>
                      <td>
                        <div className="person-meta">
                          <span className="person-name">{report.name}</span>
                          {report.description && (
                            <span className="person-sub">
                              {report.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="col-optional">
                        <Pill tone="mute">{typeLabel(report.type)}</Pill>
                      </td>
                      <td>
                        <Pill tone={report.isEnabled ? "ok" : "mute"}>
                          {report.isEnabled ? "مفعل" : "معطل"}
                        </Pill>
                      </td>
                      <td className="col-optional">
                        {report.createdByUser.firstname}{" "}
                        {report.createdByUser.lastname}
                      </td>
                      <td className="mono col-compact">
                        {executions === undefined
                          ? "—"
                          : formatNumber(executions)}
                      </td>
                      <td className="mono col-compact">
                        {formatDate(report.updatedAt)}
                      </td>
                      <td className="col-actions">
                        <div className="row-actions">
                          <a
                            className="icon-btn icon-btn--sm"
                            href={`/reports/${report.id}`}
                            aria-label={`عرض ${report.name}`}
                            title="عرض"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/reports/${report.id}`);
                            }}
                          >
                            <Eye aria-hidden="true" />
                          </a>
                          <a
                            className="icon-btn icon-btn--sm"
                            href={`/reports/${report.id}/edit`}
                            aria-label={`تعديل ${report.name}`}
                            title="تعديل"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/reports/${report.id}/edit`);
                            }}
                          >
                            <Edit aria-hidden="true" />
                          </a>
                          <a
                            className="icon-btn icon-btn--sm"
                            href={`/reports/${report.id}/execute`}
                            aria-label={`تشغيل ${report.name}`}
                            title="تشغيل"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/reports/${report.id}/execute`);
                            }}
                          >
                            <Play aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm"
                            aria-label={
                              report.isEnabled
                                ? `تعطيل ${report.name}`
                                : `إعادة تنشيط ${report.name}`
                            }
                            title={report.isEnabled ? "تعطيل" : "تفعيل"}
                            disabled={toggling}
                            onClick={() => {
                              if (report.isEnabled) {
                                disableMutation.mutate(report.id);
                              } else {
                                enableMutation.mutate(report.id);
                              }
                            }}
                          >
                            {report.isEnabled ? (
                              <PowerOff aria-hidden="true" />
                            ) : (
                              <Power aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm danger"
                            aria-label={`حذف ${report.name}`}
                            title="حذف"
                            onClick={() => setDeleteTarget(report)}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
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
            icon={hasFilter ? SearchX : FileText}
            title={hasFilter ? "لا نتائج مطابقة" : "لا توجد تقارير بعد"}
            text={
              hasFilter
                ? "لم نجد تقريراً يطابق البحث أو فلتر الحالة الحالي. جرّب تعديل الفلاتر."
                : "أنشئ أول تقرير مخصص لتشغيله وتصدير نتائجه."
            }
            action={
              hasFilter ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearFilters}
                >
                  مسح الفلاتر
                </button>
              ) : (
                <a
                  className="btn btn-primary btn-sm"
                  href="/reports/new"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate("/reports/new");
                  }}
                >
                  <Plus aria-hidden="true" />
                  إنشاء تقرير أول
                </a>
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
        open={deleteTarget !== null}
        title="حذف التقرير"
        text={
          deleteTarget
            ? `سيُحذف تعريف التقرير «${deleteTarget.name}» نهائياً. لا يمكن التراجع عن هذا الإجراء.`
            : undefined
        }
        confirmLabel="حذف التقرير"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
      />
    </>
  );
}
